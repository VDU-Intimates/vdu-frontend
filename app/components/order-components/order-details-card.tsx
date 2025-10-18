/* eslint-disable @typescript-eslint/no-explicit-any */
// components/order-components/order-details-card.tsx
import toast from "react-hot-toast";
import PrimaryButton from "@/app/components/common-components/primary-button";
import { Check, X, ShoppingCart, Truck, PackageCheck, Paintbrush, FileText, Image as ImageIcon, Download } from "lucide-react";
import { useState, Fragment } from "react";
import Image from "next/image";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import BackButton from "../common-components/back-button";

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

interface CustomText {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  left: number;
  top: number;
  angle: number;
}

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string | null;
  isCustomized?: boolean;
  customPreviewUrl?: string | null;   // can be data URL or http(s) URL
  customImageUrls?: string[];         // can be data URLs or http(s) URLs
  customTexts?: CustomText[];
}

interface OrderDetails {
  date: string;
  customerName: string;
  orderStatus: OrderStatus;
  discount: number;
  totalAmount: number;
}

interface OrderDetailsCardProps {
  order: OrderDetails;
  items: OrderItem[];
  orderId: string;
}

const getAuthToken = () => localStorage.getItem("access_token");

/* -------------------------------
   Utilities for safe downloads
-------------------------------- */

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/g; // Windows + control chars
function sanitizeFilename(name: string, max = 120) {
  const clean = name.replace(INVALID_CHARS, "-").replace(/\s+/g, " ").trim();
  return clean.slice(0, max);
}

function isDataUrl(url: string) {
  return /^data:/i.test(url);
}

function extFromMime(mime: string | undefined): string {
  if (!mime) return "bin";
  const [type, subtype] = mime.split("/");
  if (type === "image") {
    if (subtype.includes("jpeg")) return "jpg";
    if (subtype.includes("svg"))  return "svg";
    if (subtype.includes("png"))  return "png";
    if (subtype.includes("webp")) return "webp";
    if (subtype.includes("gif"))  return "gif";
    return subtype.replace(/\+xml$/i, "");
  }
  if (type === "text" && subtype === "plain") return "txt";
  return subtype || "bin";
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  // data:[<mediatype>][;base64],<data>
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) {
    // fallback: treat everything after comma as base64
    const comma = dataUrl.indexOf(",");
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return { blob: new Blob([arr]), mime: "application/octet-stream" };
  }

  const mime = match[1] || "application/octet-stream";
  const isBase64 = !!match[2];
  const data = match[3] || "";

  if (isBase64) {
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return { blob: new Blob([arr], { type: mime }), mime };
  } else {
    // URL-encoded
    const text = decodeURIComponent(data);
    return { blob: new Blob([text], { type: mime }), mime };
  }
}

async function fetchAsBlob(url: string): Promise<{ blob: Blob; mime: string }> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const mime = res.headers.get("Content-Type") || undefined;
  const blob = await res.blob();
  return { blob, mime: mime || blob.type || "application/octet-stream" };
}

/* -------------------------------
   Component
-------------------------------- */

const OrderDetailsCard = ({ order, items, orderId }: OrderDetailsCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderStatus = async (status: OrderStatus) => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) { toast.error("Authentication error."); setIsLoading(false); return; }
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status.");
      toast.success(`Order successfully updated to ${status.toLowerCase()}!`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subTotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
      case "Accepted":
      case "Shipped":
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  /* -------------------------------------------
     Download helpers (fixed for data URLs)
  ------------------------------------------- */

  // Download a single URL (data URL or http) with a safe filename
  const downloadFile = async (url: string, baseName: string, fallbackExt = "png") => {
    try {
      let blob: Blob;
      let mime: string | undefined;

      if (isDataUrl(url)) {
        const result = dataUrlToBlob(url);
        blob = result.blob;
        mime = result.mime;
      } else {
        const result = await fetchAsBlob(url);
        blob = result.blob;
        mime = result.mime;
      }

      const ext = extFromMime(mime) || fallbackExt;
      const safe = sanitizeFilename(baseName);
      saveAs(blob, `${safe}.${ext}`);
      toast.success(`Downloaded ${safe}.${ext}`);
    } catch (e) {
      console.error("Download error:", e);
      toast.error("Failed to download file.");
    }
  };

  // Download many images as a ZIP
  const downloadAllImagesAsZip = async (imageUrls: string[], itemName: string) => {
    if (!imageUrls || imageUrls.length === 0) {
      toast.error("No images to download.");
      return;
    }

    const toastId = toast.loading("Preparing images…");
    try {
      // If only one, just save it plainly
      if (imageUrls.length === 1) {
        const one = imageUrls[0];
        await downloadFile(one, `${orderId}-${itemName}-custom-image-1`);
        toast.dismiss(toastId);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(`${sanitizeFilename(orderId)}-${sanitizeFilename(itemName)}-custom-images`);

      let idx = 1;
      for (const url of imageUrls) {
        try {
          let blob: Blob;
          let mime: string | undefined;

          if (isDataUrl(url)) {
            const r = dataUrlToBlob(url);
            blob = r.blob;
            mime = r.mime;
          } else {
            const r = await fetchAsBlob(url);
            blob = r.blob;
            mime = r.mime;
          }

          const ext = extFromMime(mime) || "png";
          const n = String(idx).padStart(2, "0");
          folder?.file(`image-${n}.${ext}`, blob);
          idx++;
        } catch (e) {
          // Skip bad images but continue zipping others
          console.warn("Skipping bad image:", e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${sanitizeFilename(orderId)}-${sanitizeFilename(itemName)}-custom-images.zip`);
      toast.success("Images downloaded as ZIP!");
    } catch (e) {
      console.error("ZIP error:", e);
      toast.error("Failed to download images as ZIP.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Custom texts → TXT
  const downloadCustomTexts = (texts: CustomText[], itemName: string) => {
    if (!texts || texts.length === 0) {
      toast.error("No custom texts to download.");
      return;
    }
    const textContent = texts
      .map(
        (t, i) =>
          `Text #${i + 1}:\n` +
          `  Content: "${t.content}"\n` +
          `  Font: ${t.fontFamily}\n` +
          `  Size: ${t.fontSize}px\n` +
          `  Color: ${t.color}\n` +
          `  Position: (Left: ${t.left}, Top: ${t.top})\n` +
          `  Angle: ${t.angle}°\n`
      )
      .join("\n---\n\n");

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const safe = `${sanitizeFilename(orderId)}-${sanitizeFilename(itemName)}-custom-texts`;
    saveAs(blob, `${safe}.txt`);
    toast.success("Custom texts downloaded!");
  };

  /* -------------------------------------------
     Render
  ------------------------------------------- */

  const ActionButton = () => {
    switch (order.orderStatus) {
      case "Pending":
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Actions</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "ACCEPT ORDER"}
              icon={Check}
              onClick={() => updateOrderStatus("Accepted")}
              className={`!w-full !h-auto ${isLoading ? "opacity-50" : ""}`}
            />
            <div className={`w-full h-auto rounded-lg p-[1px] bg-red-600 ${isLoading ? "opacity-50" : ""}`}>
              <button
                onClick={() => updateOrderStatus("Cancelled")}
                disabled={isLoading}
                className="p-3 flex items-center justify-center bg-red-600 hover:bg-red-700 w-full h-full rounded-lg text-white font-bold gap-2 transition-colors disabled:cursor-not-allowed"
              >
                REJECT ORDER <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case "Accepted":
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS SHIPPED"}
              icon={Truck}
              onClick={() => updateOrderStatus("Shipped")}
              className={`!w-full !h-auto ${isLoading ? "opacity-50" : ""}`}
            />
          </div>
        );
      case "Shipped":
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS DELIVERED"}
              icon={PackageCheck}
              onClick={() => updateOrderStatus("Delivered")}
              className={`!w-full !h-auto ${isLoading ? "opacity-50" : ""}`}
            />
          </div>
        );
      default:
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h4>
            <div className={`w-full text-center p-3 rounded-lg font-bold text-md ${getStatusClasses(order.orderStatus)}`}>
              {order.orderStatus}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full border border-gray-100">
      {/* If you have a BackButton component, keep it; otherwise remove */}
      <BackButton label="Back to All Orders" className="mb-4" />

      {/* Pricing */}
      <div className="space-y-2 text-sm mb-6">
        <div className="font-medium text-lg">
          Order ID: <span className="font-semibold">{orderId}</span>
        </div>
        <hr className="my-2" />
        <div className="font-medium">
          Customer: <span className="float-right font-normal">{order.customerName}</span>
        </div>
        <div className="font-medium">
          Order Placed:{" "}
          <span className="float-right font-normal">
            {new Date(order.date).toLocaleDateString()}
          </span>
        </div>
        <hr className="my-3 border-dashed" />
        <div className="font-medium">
          Subtotal: <span className="float-right font-normal">Rs. {subTotal.toLocaleString()}</span>
        </div>
        {order.discount > 0 && (
          <div className="font-medium text-red-500">
            Discount: <span className="float-right font-normal">- Rs. {order.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="font-bold text-base pt-1">
          Grand Total: <span className="float-right">Rs. {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          Items in this Order
        </h3>

        <div className="space-y-4">
          {items.map((item) => (
            <Fragment key={item._id}>
              {item.isCustomized ? (
                <div className="border-2 border-blue-200 rounded-lg bg-blue-50/50 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <Paintbrush className="w-5 h-5" />
                      Customized Item
                    </h4>
                    <span className="text-right font-semibold text-gray-900">
                      Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-start text-sm">
                    {/* Preview image + download */}
                    <div className="col-span-12 md:col-span-4 flex flex-col items-center">
                      <Image
                        src={item.customPreviewUrl || "/assets/icons/logo.jpg"}
                        alt={`Custom design for ${item.name}`}
                        width={150}
                        height={150}
                        className="rounded-md object-cover aspect-square bg-white w-full shadow-sm"
                      />
                      {item.customPreviewUrl && (
                        <button
                          onClick={() =>
                            downloadFile(
                              item.customPreviewUrl!,
                              `${orderId}-${item.name}-custom-preview`
                            )
                          }
                          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Download className="w-3 h-3" /> Download Preview
                        </button>
                      )}
                    </div>

                    {/* Details */}
                    <div className="col-span-12 md:col-span-8 space-y-4">
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <p className="text-xs text-gray-500">
                          {item.productId} (Qty: {item.quantity})
                        </p>
                      </div>

                      {/* Uploaded images + zip */}
                      {item.customImageUrls && item.customImageUrls.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5" /> Uploaded Images
                            </h5>
                            <button
                              onClick={() => downloadAllImagesAsZip(item.customImageUrls!, item.name)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Download className="w-3 h-3" /> Download All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.customImageUrls.map((url, i) => (
                              <Image
                                key={i}
                                src={url}
                                alt={`Upload ${i + 1}`}
                                width={50}
                                height={50}
                                className="rounded object-cover aspect-square bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom texts + txt */}
                      {item.customTexts && item.customTexts.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Custom Texts
                            </h5>
                            <button
                              onClick={() => downloadCustomTexts(item.customTexts!, item.name)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Download className="w-3 h-3" /> Download Text
                            </button>
                          </div>
                          <ul className="space-y-1 text-xs list-disc list-inside">
                            {item.customTexts.map((t, i) => (
                              <li key={i} className="text-gray-700">
                                &quot;{t.content}&quot; -{" "}
                                <span className="text-gray-500">
                                  {t.fontFamily},{" "}
                                  <span style={{ color: t.color }}>■</span> {t.color}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Non-custom item
                <div className="border rounded-lg p-3 bg-gray-50/50 grid grid-cols-12 gap-4 items-center text-sm">
                  <div className="col-span-2">
                    <Image
                      src={item.photoUrl || "/assets/icons/logo.jpg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover aspect-square bg-gray-100"
                    />
                  </div>
                  <div className="col-span-5">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <p className="text-xs text-gray-500">{item.productId}</p>
                  </div>
                  <span className="col-span-2 text-gray-600">Qty: {item.quantity}</span>
                  <span className="col-span-3 text-right font-semibold text-gray-900">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ActionButton />
      </div>
    </div>
  );
};

export default OrderDetailsCard;
