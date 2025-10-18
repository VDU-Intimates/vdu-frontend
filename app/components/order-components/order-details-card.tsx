/* eslint-disable @typescript-eslint/no-explicit-any */
// components/order-components/order-details-card.tsx
import toast from "react-hot-toast";
import PrimaryButton from "@/app/components/common-components/primary-button";
import { Check, X, ShoppingCart, Truck, PackageCheck, Paintbrush, FileText, Image as ImageIcon, Download } from "lucide-react";
import { useState, Fragment } from "react";
import Image from "next/image";
import BackButton from "../common-components/back-button";

// Optional: For ZIP file generation if multiple images exist
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

// Interface for custom text objects
interface CustomText {
  content: string;
  fontFamily: string;
  fontSize: number; // Added from schema for full text details
  color: string;
  left: number; // Added from schema for full text details
  top: number; // Added from schema for full text details
  angle: number; // Added from schema for full text details
}

// Updated OrderItem interface to match the new API response
interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string | null;
  isCustomized?: boolean;
  customPreviewUrl?: string | null;
  customImageUrls?: string[];
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

const getAuthToken = () => localStorage.getItem('access_token');

const OrderDetailsCard = ({ order, items, orderId }: OrderDetailsCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderStatus = async (status: OrderStatus) => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) { toast.error("Authentication error."); setIsLoading(false); return; }
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status.');
      toast.success(`Order successfully updated to ${status.toLowerCase()}!`);
      // Consider a more granular state update instead of full reload for better UX
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
      case 'Accepted':
      case 'Shipped':
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const ActionButton = () => {
    switch (order.orderStatus) {
      case 'Pending':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Actions</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "ACCEPT ORDER"}
              icon={Check}
              onClick={() => updateOrderStatus('Accepted')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
            />
            <div className={`w-full h-auto rounded-lg p-[1px] bg-red-600 ${isLoading ? 'opacity-50' : ''}`}>
              <button
                onClick={() => updateOrderStatus('Cancelled')}
                disabled={isLoading}
                className="p-3 flex items-center justify-center bg-red-600 hover:bg-red-700 w-full h-full rounded-lg text-white font-bold gap-2 transition-colors disabled:cursor-not-allowed"
              >
                REJECT ORDER <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 'Accepted':
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS SHIPPED"}
              icon={Truck}
              onClick={() => updateOrderStatus('Shipped')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
            />
          </div>
        );
      case 'Shipped':
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS DELIVERED"}
              icon={PackageCheck}
              onClick={() => updateOrderStatus('Delivered')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
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

  // --- NEW: Helper function to download a single file ---
  const downloadFile = (url: string, filename: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        saveAs(blob, filename);
        toast.success(`Downloaded ${filename}`);
      })
      .catch(error => {
        console.error("Download error:", error);
        toast.error(`Failed to download ${filename}`);
      });
  };

  // --- NEW: Helper function to download all images as a ZIP ---
  const downloadAllImagesAsZip = async (imageUrls: string[], itemName: string) => {
    if (!imageUrls || imageUrls.length === 0) {
      toast.error("No images to download.");
      return;
    }

    if (imageUrls.length === 1) {
      // If only one image, download it directly
      const url = imageUrls[0];
      const filename = `${itemName}-custom-image-1.${url.split('.').pop() || 'png'}`;
      downloadFile(url, filename);
      return;
    }

    toast.loading("Preparing images for download...");
    const zip = new JSZip();
    const folder = zip.folder(`${orderId}-${itemName}-custom-images`);

    try {
      await Promise.all(imageUrls.map(async (url, index) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const extension = url.split('.').pop() || 'png';
        folder?.file(`image-${index + 1}.${extension}`, blob);
      }));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${orderId}-${itemName}-custom-images.zip`);
      toast.success("All images downloaded as ZIP!");
    } catch (error) {
      console.error("Error creating or downloading ZIP:", error);
      toast.error("Failed to download images as ZIP.");
    } finally {
      toast.dismiss(); // Dismiss the loading toast
    }
  };

  // --- NEW: Helper function to download custom texts as a TXT file ---
  const downloadCustomTexts = (texts: CustomText[], itemName: string) => {
    if (!texts || texts.length === 0) {
      toast.error("No custom texts to download.");
      return;
    }

    const textContent = texts.map((text, index) =>
      `Text #${index + 1}:\n` +
      `  Content: "${text.content}"\n` +
      `  Font: ${text.fontFamily}\n` +
      `  Size: ${text.fontSize}px\n` +
      `  Color: ${text.color}\n` +
      `  Position: (Left: ${text.left}, Top: ${text.top})\n` +
      `  Angle: ${text.angle}°\n`
    ).join('\n---\n\n');

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${orderId}-${itemName}-custom-texts.txt`);
    toast.success("Custom texts downloaded!");
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full border border-gray-100">
      <BackButton label="Back to All Orders" className="mb-4" />

      {/* Pricing */}
      <div className="space-y-2 text-sm mb-6">
        <div className="font-medium text-lg">Order ID: <span className="font-semibold">{orderId}</span></div>
        <hr className="my-2"/>
        <div className="font-medium">Customer: <span className="float-right font-normal">{order.customerName}</span></div>
        <div className="font-medium">Order Placed: <span className="float-right font-normal">{new Date(order.date).toLocaleDateString()}</span></div>
        <hr className="my-3 border-dashed"/>
        <div className="font-medium">Subtotal: <span className="float-right font-normal">Rs. {subTotal.toLocaleString()}</span></div>
        {order.discount > 0 && (
          <div className="font-medium text-red-500">Discount: <span className="float-right font-normal">- Rs. {order.discount.toLocaleString()}</span></div>
        )}
        <div className="font-bold text-base pt-1">Grand Total: <span className="float-right">Rs. {order.totalAmount.toLocaleString()}</span></div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          Items in this Order
        </h3>
        <div className="space-y-4">
          {items.map(item => (
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
                    {/* Preview Image & Download Button */}
                    <div className="col-span-12 md:col-span-4 flex flex-col items-center">
                       <Image
                        src={item.customPreviewUrl || '/assets/icons/logo.jpg'}
                        alt={`Custom design for ${item.name}`}
                        width={150}
                        height={150}
                        className="rounded-md object-cover aspect-square bg-white w-full shadow-sm"
                      />
                      {item.customPreviewUrl && (
                         <button
                            onClick={() => downloadFile(item.customPreviewUrl!, `${orderId}-${item.name}-custom-preview.${item.customPreviewUrl!.split('.').pop() || 'png'}`)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download Preview
                          </button>
                      )}
                    </div>
                    {/* Customization Details */}
                    <div className="col-span-12 md:col-span-8 space-y-4">
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.productId} (Qty: {item.quantity})</p>
                      </div>
                      {/* Uploaded Images & Download Button */}
                      {item.customImageUrls && item.customImageUrls.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Uploaded Images</h5>
                            <button
                                onClick={() => downloadAllImagesAsZip(item.customImageUrls!, item.name)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Download className="w-3 h-3" /> Download All
                              </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.customImageUrls.map((url, index) => (
                              <Image key={index} src={url} alt={`Upload ${index+1}`} width={50} height={50} className="rounded object-cover aspect-square bg-white" />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Custom Texts & Download Button */}
                      {item.customTexts && item.customTexts.length > 0 && (
                         <div>
                           <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Custom Texts</h5>
                            <button
                                onClick={() => downloadCustomTexts(item.customTexts!, item.name)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Download className="w-3 h-3" /> Download Text
                              </button>
                           </div>
                           <ul className="space-y-1 text-xs list-disc list-inside">
                             {item.customTexts.map((text, index) => (
                               <li key={index} className="text-gray-700">
                                 "{text.content}" - <span className="text-gray-500">{text.fontFamily}, <span style={{color: text.color}}>■</span> {text.color}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Standard item row (no change)
                <div className="border rounded-lg p-3 bg-gray-50/50 grid grid-cols-12 gap-4 items-center text-sm">
                  <div className="col-span-2">
                    <Image
                      src={item.photoUrl || '/assets/icons/logo.jpg'}
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