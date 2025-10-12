/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import * as fabricNS from "fabric";

// The module sometimes appears as { fabric: <API> } and sometimes directly as <API>.
type FabricAPI = typeof import("fabric"); // the public API (Canvas, Image, etc.)
type MaybeWrapped = FabricAPI & { fabric?: FabricAPI };

/** Use fabricNS.fabric if present; otherwise use fabricNS itself — fully typed, no `any`. */
export const fabric = ((fabricNS as MaybeWrapped).fabric ?? fabricNS) as FabricAPI;
import { Plus, ShoppingCart, Type, Upload, X, ZoomIn } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Buttons from '../components/common-components/button';
import Footer from '../components/footer/footer';
import NavBar from '../components/nav-bar/nav-bar';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

/* ===========================
   Helpers & Types
=========================== */

function hasFontFaceSet(d: Document): d is Document & { fonts: FontFaceSet } {
  return typeof (d as Document & Partial<{ fonts: FontFaceSet }>).fonts !== 'undefined';
}

export async function ensureFontLoaded(family: string, weight = 400): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!hasFontFaceSet(document)) return;
  try {
    await document.fonts.load(`${weight} 16px ${family}`);
    await document.fonts.ready;
  } catch { /* ignore */ }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function getToken() {
  try {
    return localStorage.getItem('access_token') || '';
  } catch {
    return '';
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message?: unknown }).message);
  }
  return 'Something went wrong.';
}

type ApiUser = {
  userId: string;
  fName: string;
  lName: string;
  email: string;
  address?: string | null;
  contact?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiProduct = {
  _id: string;
  productId: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string;
  colors: string[];
  sizes: string[];
  category: 'T-Shirt' | 'Intimate';
  stock: number;
};

type Design = {
  _id: string;
  designUrl: string;
  imageUrls: string[];
  texts: Array<{
    content: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    left?: number;
    top?: number;
    angle?: number;
  }>;
  productName?: string;
  createdAt: string;
};

/* ===========================
   OPTIONAL: compose helper
   (kept as-is, not required for interactions)
=========================== */
async function composeDesignOnBase(zonePngUrl: string, baseUrl: string): Promise<string> {
  const tee = await fabric.Image.fromURL(baseUrl, { crossOrigin: 'anonymous' });
  const teeW = tee.width || 800;
  const teeH = tee.height || Math.round((teeW * 4) / 3);

  const stageEl = document.createElement('canvas');
  const stage = new fabric.Canvas(stageEl);
  stage.setDimensions({ width: teeW, height: teeH });

  tee.set({ left: 0, top: 0, selectable: false, evented: false });
  stage.add(tee);

  const zone = await fabric.Image.fromURL(zonePngUrl, { crossOrigin: 'anonymous' });

  // put the design roughly in the upper middle (adjust if needed)
  const chestW = teeW * 0.42;
  const chestH = chestW;
  const left = teeW * 0.5 - chestW / 2;
  const top = teeH * 0.26;

  const scaleX = chestW / (zone.width || 1);
  const scaleY = chestH / (zone.height || 1);

  zone.set({ left, top, scaleX, scaleY, selectable: false, evented: false });
  stage.add(zone);
  stage.renderAll();

  const out = stage.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: true });
  stage.dispose();
  return out;
}

/* ===========================
   Component
=========================== */

const CustomizationPage = () => {
  // internal coordinate system
  const BASE_W = 200;
  const BASE_H = 200;

  // color picker for NEW text
  const [color, setColor] = useState('#255384');

  // Refs
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const fontRef = useRef<HTMLSelectElement | null>(null);
  const sizeRef = useRef<HTMLSelectElement | null>(null);
  const userTextsRef = useRef<fabricNS.Textbox[]>([]);
  type UserImage = { node: fabricNS.FabricImage; src: string };
  const userImagesRef = useRef<UserImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fRef = useRef<fabricNS.Canvas | null>(null);

   
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const search = useSearchParams();
  const paramId = search.get('id')?.trim() || '';
  const paraSize = search.get('size')?.trim() || '';
  const paramColor = search.get('color')?.trim() || ''

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);

  // Previous designs
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  /* ---------- auth ---------- */
  useEffect(() => {
    const run = async () => {
      const token = getToken();
      if (!token) return setCurrentUser(null);
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return setCurrentUser(null);
        const data: { user: ApiUser } = await res.json();
        setCurrentUser(data.user);
      } catch {
        setCurrentUser(null);
      }
    };
    run();
  }, []);

  /* ---------- product ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!paramId) {
          setErr('Missing product id');
          setProduct(null);
          return;
        }
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(paramId)}`);
        if (!res.ok) {
          setErr(res.status === 404 ? 'Product not found' : `Failed to load product (HTTP ${res.status})`);
          setProduct(null);
          return;
        }
        const doc: ApiProduct = await res.json();
        if (!cancelled) setProduct(doc);
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(getErrorMessage(e) || 'Failed to load product');
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paramId]);

  const productBg = useMemo(
    () => product?.photoUrl || '/assets/images/placeholder-tshirt.jpg',
    [product?.photoUrl]
  );

  /* ===========================
     Fabric Canvas Setup
  =========================== */
  useEffect(() => {
    const el = canvasRef.current;
    const zone = zoneRef.current;
    if (!el || !zone) return;

    console.log('[fabric] init canvas', { el, zone });

    const canvas = new fabric.Canvas(el);
    fRef.current = canvas;

    // lock internal coords
    canvas.setWidth(BASE_W);
    canvas.setHeight(BASE_H);

    // scale visually only
    const sync = () => {
      const w = Math.max(1, Math.round(zone.clientWidth));
      const h = Math.max(1, Math.round(zone.clientHeight));
      canvas.setDimensions({ width: w, height: h }, { cssOnly: true });
      canvas.calcOffset();
      canvas.requestRenderAll();
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(zone);

    // make sure the canvas receives events
    (canvas.getElement() as HTMLCanvasElement).style.pointerEvents = 'auto';
    (canvas.getElement() as HTMLCanvasElement).style.zIndex = '10';

    return () => {
      console.log('[fabric] dispose canvas');
      ro.disconnect();
      canvas.dispose();
      fRef.current = null;
    };
  }, []);

  /* ===========================
     Image Handlers
  =========================== */
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[add-image] input change');
    const canvas = fRef.current;
    if (!canvas) { console.warn('[add-image] no canvas'); return; }

    const file = e.target.files?.[0];
    if (!file) { console.warn('[add-image] no file selected'); return; }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (ev: ProgressEvent<FileReader>) => {
      console.log('[add-image] reader loaded');
      const url = ev.target?.result;
      if (typeof url !== 'string') { console.warn('[add-image] not a data URL'); return; }

      const img = await fabric.Image.fromURL(url, { crossOrigin: 'anonymous' });

      // fit into internal 200x200 box
      const padding = 0.9;
      const scale = Math.min(
        (BASE_W * padding) / (img.width || BASE_W),
        (BASE_H * padding) / (img.height || BASE_H)
      );

      img.set({
        originX: 'center',
        originY: 'center',
        left: BASE_W / 2,
        top: BASE_H / 2,
      });
      img.scale(scale);

      canvas.add(img);

      img.set({
        borderColor: '#306D42',
        cornerColor: '#306D42',
        cornerSize: 11,
        cornerStyle: 'rectangle',
        transparentCorners: false,
      });

      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      console.log('[add-image] added to canvas');

      userImagesRef.current.push({ node: img, src: url });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  const handleRemoveImage = () => {
    console.log('[remove-image] clicked');
    const canvas = fRef.current;
    if (!canvas) return;

    const img = userImagesRef.current.pop();
    if (!img) return;

    canvas.remove(img.node);
    img.node.dispose?.();
    canvas.requestRenderAll();
  };

  /* ===========================
     Text Handlers
  =========================== */
  const handleAddText = async () => {
    console.log('[add-text] clicked');
    const canvas = fRef.current;
    if (!canvas) { console.warn('[add-text] no canvas'); return; }

    const textValue = textInputRef.current?.value?.trim() || '';
    if (!textValue) { console.warn('[add-text] empty text'); return; }

    const fontFamily = fontRef.current?.value || 'Raleway';
    const fontSize = Number(sizeRef.current?.value || 16);

    await ensureFontLoaded(fontFamily, 400);

    const tb = new fabric.Textbox(textValue, {
      fill: color,
      fontFamily,
      fontSize,
      originX: 'center',
      originY: 'center',
      left: BASE_W / 2,
      top: BASE_H / 2,
      editable: true,
    });

    canvas.add(tb);
    canvas.setActiveObject(tb);
    canvas.requestRenderAll();
    console.log('[add-text] added to canvas');

    userTextsRef.current.push(tb);
  };

  const handleRemoveText = () => {
    console.log('[remove-text] clicked');
    const canvas = fRef.current;
    if (!canvas) return;

    const tb = userTextsRef.current.pop();
    if (!tb) return;

    canvas.remove(tb);
    canvas.requestRenderAll();
  };

  /* ===========================
     Collect Canvas Data
  =========================== */
  function collectImageUrls(): string[] {
    return userImagesRef.current.map((p) => p.src);
  }

  function collectTexts() {
    return userTextsRef.current.map((tb) => ({
      content: tb.text || '',
      fontFamily: tb.fontFamily || 'Raleway',
      fontSize: tb.fontSize || 16,
      color: (tb.fill as string) || '#000000',
      left: tb.left || 0,
      top: tb.top || 0,
      angle: tb.angle || 0,
    }));
  }

  /* ===========================
     API Calls
  =========================== */
  async function loadDesigns() {
    console.log('[designs] loading…');
    setLoadingDesigns(true);
    try {
      const res = await fetch(`${API_BASE}/api/designs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`List failed (${res.status}) ${txt}`);
      }
      const payload = await res.json();
      setDesigns(payload?.data || []);
      console.log('[designs] loaded', payload?.data?.length ?? 0);
    } catch (e) {
      console.error('[designs] error:', e);
    } finally {
      setLoadingDesigns(false);
    }
  }

  useEffect(() => { loadDesigns(); }, []);

  async function saveDesign() {
    console.log('[save] clicked');
    const canvas = fRef.current;
    if (!canvas) { console.warn('[save] no canvas'); return; }

    // Export the design zone only
    const zonePng = canvas.toDataURL({
      format: 'png',
      multiplier: 3,
      enableRetinaScaling: true,
    });

    // OPTIONAL: composite on base (using product photo when available)
    const base = productBg;
    let designUrl = zonePng;
    try {
      designUrl = await composeDesignOnBase(zonePng, base);
    } catch (e) {
      console.warn('[save] compose failed, falling back to zone only:', e);
    }

    const imageUrls = collectImageUrls();
    const texts = collectTexts();

    try {
      const res = await fetch(`${API_BASE}/api/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          designUrl,
          imageUrls,
          texts,
          productName: product?.productName || 'T-Shirt',
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Save failed (${res.status}) ${txt}`);
      }
      console.log('[save] success');
      toast.success("Design Saved");
      await loadDesigns();
    } catch (e) {
      console.error('[save] error:', e);
      toast.error("Error Saving Design");
    }
  }

  async function deleteDesign(id: string) {
    try {
      const res = await fetch(`${API_BASE}/api/designs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Design Deleted")
      await loadDesigns();
    } catch (e) {
      console.error('[delete] error:', e);
      toast.error("Error deleting Design")
    }
  }

  async function previewDesign() {
    const canvas = fRef.current;
    if (!canvas) return;
  
    // Export the current zone design
    const zonePng = canvas.toDataURL({
      format: 'png',
      multiplier: 3,
      enableRetinaScaling: true,
    });
  
    // Composite onto the product background (photoUrl or placeholder)
    const base = productBg;
    let finalOut = zonePng;
    try {
      finalOut = await composeDesignOnBase(zonePng, base);
    } catch (e) {
      console.warn('[preview] compose failed, falling back to zone only:', e);
    }
  
    // Open preview window with composited design
    const win = window.open('', '_blank');
    if (win) {
      win.document.write('<title>Design Preview</title>');
      win.document.write(
        `<img src="${finalOut}" style="display:block;max-width:100%;height:auto;" />`
      );
      win.document.close();
    }
  }
  

  /* ===========================
     UI
  =========================== */
  return (
    <div>
      <NavBar />

      <main className="min-h-screen max-md:px-5 mt-10">
        <div className="mx-auto max-w-[1450px] px-4 sm:px-6 lg:px-2 py-6 ">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            {/* Left panel */}
            <div className="rounded-xl bg-[#bfcfbf]/65 p-4 sm:p-6 lg:p-8 shadow-md">
              <h2 className="text-center mb-10  text-4xl font-bold ">Customize Your Product</h2>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="flex flex-col items-center">
                  {/* Background IMAGE behind, canvas zone above */}
                  <div className="relative mx-auto w-full max-w-[500px] aspect-[3/4] overflow-hidden rounded-2xl shadow-inner">
                    {/* product image (z-0, no pointer events) */}
                    <Image
                      src={productBg}
                      alt={product?.productName || 'Product'}
                      fill
                      className="object-cover select-none pointer-events-none z-0"
                      priority
                      draggable={false}
                    />

                    {/* Chest drop zone – responsive, above image */}
                    <div
                      ref={zoneRef}
                      className="
                        absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2
                        w-[clamp(150px,45%,260px)]
                        md:w-[clamp(160px,38%,300px)]
                        lg:w-[clamp(60px,55%,180px)]
                        xl:w-[clamp(180px,20%,380px)]
                        aspect-square rounded border-2 border-dashed border-black/60
                        z-10
                      "
                      style={{ pointerEvents: 'auto' }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full block bg-transparent"
                        style={{ zIndex: 10, pointerEvents: 'auto' }}
                      />
                    </div>
                  </div>

                  {/* Save & Preview */}
                  <div className="flex items-center justify-center gap-10 mt-5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="grid place-items-center size-9 max-md:size-7 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-colors duration-200"
                          aria-label="Save and Create New Design"
                          onClick={saveDesign}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                        Save and Create New Design
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="grid place-items-center size-9 max-md:size-7 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors duration-200"
                          aria-label="Preview Design"
                          onClick={previewDesign}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                        Preview Design
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Tools + product info */}
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-black">Product Name</h2>
                    <p className="text-black/70 font-semibold">{product?.productName || '—'}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-black">Selected Size</h2>
                    <p className="text-black/70 font-semibold">
                      {paraSize}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-black">Selected Color</h2>
                    <p className="text-black/70 font-semibold">
                      {paramColor}
                    </p>
                  </div>

                  {/* Add Image */}
                  <div className="gap-2 flex flex-col">
                    <h2 className="text-xl font-bold text-black">Add Image</h2>
                    <div className="flex justify-between max-lg:justify-start gap-5">
                      <label
                        htmlFor="image-selector"
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-all duration-300 cursor-pointer border"
                      >
                        <Upload className="h-4 w-4" /> Choose File
                        <input
                          type="file"
                          className="hidden"
                          id="image-selector"
                          ref={fileInputRef}
                          onChange={handleAddImage}
                          // accept="image/*"
                        />
                      </label>

                      <Buttons context="REMOVE IMAGE" combo="redTransparent" icon={X} onClick={handleRemoveImage} />
                    </div>
                  </div>

                  {/* Add Text */}
                  <div className="gap-2 flex flex-col">
                    <h2 className="text-xl font-bold text-black">Add Text</h2>
                    <div className="flex justify-between flex-col max-lg:justify-start gap-5">
                      <input
                        type="text"
                        placeholder="Type your Text"
                        ref={textInputRef}
                        className="border h-10 bg-white/60 max-lg:w-fit placeholder:font-normal font-semibold placeholder:text-black p-3 text-md"
                      />
                      <div className="flex flex-wrap gap-3 justify-between max-lg:justify-start">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
                          <span className="text-sm text-gray-700">Font</span>
                          <span className="text-gray-400">|</span>
                          <select ref={fontRef} className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer" defaultValue="Raleway">
                            <option value="Raleway">Raleway</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Poppins">Poppins</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
                          <select ref={sizeRef} className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer" defaultValue="16">
                            <option value="12">12</option>
                            <option value="14">14</option>
                            <option value="16">16</option>
                            <option value="20">20</option>
                            <option value="24">24</option>
                          </select>
                          <span className="text-gray-400">|</span>
                          <span className="text-sm text-gray-700">px</span>
                        </div>
                      </div>

                      {/* color for new text */}
                      <input
                        type="color"
                        className="w-full max-lg:w-[300px]"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />

                      <div className="flex justify-between max-lg:justify-start gap-5">
                        <span onClick={handleAddText}>
                          <Buttons context="ADD TEXT" icon={Type} />
                        </span>
                        <span onClick={handleRemoveText}>
                          <Buttons context="REMOVE TEXT" icon={X} combo="redTransparent" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Button (optional wiring) */}
                  <div className="flex justify-end mt-20 text-sm">
                    <Buttons context="ADD TO CART" icon={ShoppingCart} productId={product?.productId} size={paraSize}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="rounded-xl bg-[#e1dacc] p-4 sm:p-6 lg:p-8 shadow-md">
              <h2 className="text-center text-2xl font-bold underline">Previous Designs</h2>

              <div className="mt-5 space-y-4">
                {loadingDesigns && <div className="text-sm text-gray-600">Loading designs…</div>}
                {!loadingDesigns && designs.length === 0 && (
                  <div className="text-sm text-gray-600">No designs yet.</div>
                )}

                {designs.map((d) => (
                  <div key={d._id} className="w-full max-w-xl rounded-lg bg-white/60 p-4 sm:p-5 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 sm:gap-5 items-start">
                      <div className="relative h-[140px] w-full sm:w-[150px] overflow-hidden rounded-md">
                        <Image src={d.designUrl} alt="Previous Design" fill className="object-cover" />
                      </div>

                      <div className="flex flex-col gap-3 min-w-[250px]">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">
                            Product Name : <span className="font-normal">{d.productName || 'T-Shirt'}</span>
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            Created At : <span className="font-normal">{new Date(d.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>

                        <div className="mt-1 sm:mt-2 flex sm:justify-end gap-3">
                          <Buttons
                            context="DELETE DESIGN"
                            icon={X}
                            combo="redTransparent"
                            onClick={() => deleteDesign(d._id)}
                          />
                          <Buttons context="ADD TO CART" icon={ShoppingCart} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* End right panel */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomizationPage;






// /* eslint-disable @typescript-eslint/no-unused-vars */
// 'use client';

// import React, { useEffect, useRef, useState, useMemo } from 'react';
// import Image from 'next/image';
// import * as fabricNS from "fabric";

// // The module sometimes appears as { fabric: <API> } and sometimes directly as <API>.
// type FabricAPI = typeof import("fabric"); // the public API (Canvas, Image, etc.)
// type MaybeWrapped = FabricAPI & { fabric?: FabricAPI };

// /** Use fabricNS.fabric if present; otherwise use fabricNS itself — fully typed, no `any`. */
// export const fabric = ((fabricNS as MaybeWrapped).fabric ?? fabricNS) as FabricAPI;
// import { Plus, ShoppingCart, Type, Upload, X, ZoomIn } from 'lucide-react';

// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// import Buttons from '../components/common-components/button';
// import Footer from '../components/footer/footer';
// import NavBar from '../components/nav-bar/nav-bar';
// import { useSearchParams } from 'next/navigation';
// import toast from 'react-hot-toast';

// /* ===========================
//    Helpers & Types
// =========================== */

// function hasFontFaceSet(d: Document): d is Document & { fonts: FontFaceSet } {
//   return typeof (d as Document & Partial<{ fonts: FontFaceSet }>).fonts !== 'undefined';
// }

// export async function ensureFontLoaded(family: string, weight = 400): Promise<void> {
//   if (typeof document === 'undefined') return;
//   if (!hasFontFaceSet(document)) return;
//   try {
//     await document.fonts.load(`${weight} 16px ${family}`);
//     await document.fonts.ready;
//   } catch { /* ignore */ }
// }

// // NOTE: keep your existing API_BASE, we also use it for the UNSAFE PoC
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

// function getToken() {
//   try {
//     return localStorage.getItem('access_token') || '';
//   } catch {
//     return '';
//   }
// }

// function getErrorMessage(err: unknown): string {
//   if (err instanceof Error) return err.message;
//   if (typeof err === 'object' && err && 'message' in err) {
//     return String((err as { message?: unknown }).message);
//   }
//   return 'Something went wrong.';
// }

// type ApiUser = {
//   userId: string;
//   fName: string;
//   lName: string;
//   email: string;
//   address?: string | null;
//   contact?: string | null;
//   createdAt: string;
//   updatedAt: string;
// };

// type ApiProduct = {
//   _id: string;
//   productId: string;
//   productName: string;
//   description: string;
//   price: number;
//   photoUrl: string;
//   colors: string[];
//   sizes: string[];
//   category: 'T-Shirt' | 'Intimate';
//   stock: number;
// };

// type Design = {
//   _id: string;
//   designUrl: string;
//   imageUrls: string[];
//   texts: Array<{
//     content: string;
//     fontFamily?: string;
//     fontSize?: number;
//     color?: string;
//     left?: number;
//     top?: number;
//     angle?: number;
//   }>;
//   productName?: string;
//   createdAt: string;
// };

// /* ===========================
//    OPTIONAL: compose helper
//    (kept as-is, not required for interactions)
// =========================== */
// async function composeDesignOnBase(zonePngUrl: string, baseUrl: string): Promise<string> {
//   const tee = await fabric.Image.fromURL(baseUrl, { crossOrigin: 'anonymous' });
//   const teeW = tee.width || 800;
//   const teeH = tee.height || Math.round((teeW * 4) / 3);

//   const stageEl = document.createElement('canvas');
//   const stage = new fabric.Canvas(stageEl);
//   stage.setDimensions({ width: teeW, height: teeH });

//   tee.set({ left: 0, top: 0, selectable: false, evented: false });
//   stage.add(tee);

//   const zone = await fabric.Image.fromURL(zonePngUrl, { crossOrigin: 'anonymous' });

//   // put the design roughly in the upper middle (adjust if needed)
//   const chestW = teeW * 0.42;
//   const chestH = chestW;
//   const left = teeW * 0.5 - chestW / 2;
//   const top = teeH * 0.26;

//   const scaleX = chestW / (zone.width || 1);
//   const scaleY = chestH / (zone.height || 1);

//   zone.set({ left, top, scaleX, scaleY, selectable: false, evented: false });
//   stage.add(zone);
//   stage.renderAll();

//   const out = stage.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: true });
//   stage.dispose();
//   return out;
// }

// /* ===========================
//    UNSAFE-VULN: Dev-only file upload vulnerability PoC
//    - Flip ENABLE_UNSAFE_UPLOAD_VULN to false to disable quickly.
//    - This posts raw .html/.svg (or any file) to the backend and opens it in a new tab.
//    - If backend serves it as text/html or image/svg+xml without safe headers/CSP,
//      the inline <script> executes — demonstrating a real CWE-434.
// =========================== */
// const ENABLE_UNSAFE_UPLOAD_VULN = true; // <<< set to false to disable the PoC/UI

// async function unsafeUploadRawFileAndOpen(file: File) {
//   if (!ENABLE_UNSAFE_UPLOAD_VULN) {
//     toast.error('UNSAFE PoC disabled');
//     return;
//   }
//   try {
//     const fd = new FormData();
//     fd.append('file', file); // raw, unfiltered

//     // IMPORTANT: this must map to your new UNSAFE backend route (see backend snippet)
//     const res = await fetch(`${API_BASE}/api/upload-unsafe`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${getToken()}`, // optional if your dev route ignores auth
//         // DO NOT set Content-Type for FormData
//       },
//       body: fd,
//       cache: 'no-store',
//       mode: 'cors',
//     });

//     if (!res.ok) {
//       const txt = await res.text().catch(() => '');
//       throw new Error(`UNSAFE upload failed (${res.status}) ${txt}`);
//     }
//     const payload = await res.json();
//     const url: string | undefined = payload?.url ?? payload?.data?.url;
//     if (!url) throw new Error('UNSAFE upload: backend did not return url');

//     // This opens as a DOCUMENT (not image/canvas), which is how scripts execute.
//     window.open(url, '_blank', 'noopener,noreferrer');
//     toast.success('Opened uploaded file (UNSAFE PoC). Check the new tab.');
//     console.log('[UNSAFE-VULN] Opened:', url);
//   } catch (e) {
//     console.error('[UNSAFE-VULN] error:', e);
//     toast.error(getErrorMessage(e));
//   }
// }
// /* ===========================
//    END UNSAFE-VULN helpers
// =========================== */

// /* ===========================
//    Component
// =========================== */

// const CustomizationPage = () => {
//   // internal coordinate system
//   const BASE_W = 200;
//   const BASE_H = 200;

//   // color picker for NEW text
//   const [color, setColor] = useState('#255384');

//   // Refs
//   const textInputRef = useRef<HTMLInputElement | null>(null);
//   const fontRef = useRef<HTMLSelectElement | null>(null);
//   const sizeRef = useRef<HTMLSelectElement | null>(null);
//   const userTextsRef = useRef<fabricNS.Textbox[]>([]);
//   type UserImage = { node: fabricNS.FabricImage; src: string };
//   const userImagesRef = useRef<UserImage[]>([]);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const zoneRef = useRef<HTMLDivElement | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const fRef = useRef<fabricNS.Canvas | null>(null);

//   const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
//   const search = useSearchParams();
//   const paramId = search.get('id')?.trim() || '';
//   const paraSize = search.get('size')?.trim() || '';
//   const paramColor = search.get('color')?.trim() || ''

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const [product, setProduct] = useState<ApiProduct | null>(null);

//   // Previous designs
//   const [designs, setDesigns] = useState<Design[]>([]);
//   const [loadingDesigns, setLoadingDesigns] = useState(false);

//   /* ---------- auth ---------- */
//   useEffect(() => {
//     const run = async () => {
//       const token = getToken();
//       if (!token) return setCurrentUser(null);
//       try {
//         const res = await fetch(`${API_BASE}/api/auth/me`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) return setCurrentUser(null);
//         const data: { user: ApiUser } = await res.json();
//         setCurrentUser(data.user);
//       } catch {
//         setCurrentUser(null);
//       }
//     };
//     run();
//   }, []);

//   /* ---------- product ---------- */
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         if (!paramId) {
//           setErr('Missing product id');
//           setProduct(null);
//           return;
//         }
//         setLoading(true);
//         setErr(null);
//         const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(paramId)}`);
//         if (!res.ok) {
//           setErr(res.status === 404 ? 'Product not found' : `Failed to load product (HTTP ${res.status})`);
//           setProduct(null);
//           return;
//         }
//         const doc: ApiProduct = await res.json();
//         if (!cancelled) setProduct(doc);
//       } catch (e: unknown) {
//         if (!cancelled) {
//           setErr(getErrorMessage(e) || 'Failed to load product');
//           setProduct(null);
//         }
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();
//     return () => { cancelled = true; };
//   }, [paramId]);

//   const productBg = useMemo(
//     () => product?.photoUrl || '/assets/images/placeholder-tshirt.jpg',
//     [product?.photoUrl]
//   );

//   /* ===========================
//      Fabric Canvas Setup
//   =========================== */
//   useEffect(() => {
//     const el = canvasRef.current;
//     const zone = zoneRef.current;
//     if (!el || !zone) return;

//     console.log('[fabric] init canvas', { el, zone });

//     const canvas = new fabric.Canvas(el);
//     fRef.current = canvas;

//     // lock internal coords
//     canvas.setWidth(BASE_W);
//     canvas.setHeight(BASE_H);

//     // scale visually only
//     const sync = () => {
//       const w = Math.max(1, Math.round(zone.clientWidth));
//       const h = Math.max(1, Math.round(zone.clientHeight));
//       canvas.setDimensions({ width: w, height: h }, { cssOnly: true });
//       canvas.calcOffset();
//       canvas.requestRenderAll();
//     };

//     sync();
//     const ro = new ResizeObserver(sync);
//     ro.observe(zone);

//     // make sure the canvas receives events
//     (canvas.getElement() as HTMLCanvasElement).style.pointerEvents = 'auto';
//     (canvas.getElement() as HTMLCanvasElement).style.zIndex = '10';

//     return () => {
//       console.log('[fabric] dispose canvas');
//       ro.disconnect();
//       canvas.dispose();
//       fRef.current = null;
//     };
//   }, []);

//   /* ===========================
//      Image Handlers
//   =========================== */
//   const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
//     console.log('[add-image] input change');
//     const canvas = fRef.current;
//     if (!canvas) { console.warn('[add-image] no canvas'); return; }

//     const file = e.target.files?.[0];
//     if (!file) { console.warn('[add-image] no file selected'); return; }

//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = async (ev: ProgressEvent<FileReader>) => {
//       console.log('[add-image] reader loaded');
//       const url = ev.target?.result;
//       if (typeof url !== 'string') { console.warn('[add-image] not a data URL'); return; }

//       const img = await fabric.Image.fromURL(url, { crossOrigin: 'anonymous' });

//       // fit into internal 200x200 box
//       const padding = 0.9;
//       const scale = Math.min(
//         (BASE_W * padding) / (img.width || BASE_W),
//         (BASE_H * padding) / (img.height || BASE_H)
//       );

//       img.set({
//         originX: 'center',
//         originY: 'center',
//         left: BASE_W / 2,
//         top: BASE_H / 2,
//       });
//       img.scale(scale);

//       canvas.add(img);

//       img.set({
//         borderColor: '#306D42',
//         cornerColor: '#306D42',
//         cornerSize: 11,
//         cornerStyle: 'rectangle',
//         transparentCorners: false,
//       });

//       canvas.setActiveObject(img);
//       canvas.requestRenderAll();
//       console.log('[add-image] added to canvas');

//       userImagesRef.current.push({ node: img, src: url });
//       if (fileInputRef.current) fileInputRef.current.value = '';
//     };
//   };

//   const handleRemoveImage = () => {
//     console.log('[remove-image] clicked');
//     const canvas = fRef.current;
//     if (!canvas) return;

//     const img = userImagesRef.current.pop();
//     if (!img) return;

//     canvas.remove(img.node);
//     img.node.dispose?.();
//     canvas.requestRenderAll();
//   };

//   /* ===========================
//      Text Handlers
//   =========================== */
//   const handleAddText = async () => {
//     console.log('[add-text] clicked');
//     const canvas = fRef.current;
//     if (!canvas) { console.warn('[add-text] no canvas'); return; }

//     const textValue = textInputRef.current?.value?.trim() || '';
//     if (!textValue) { console.warn('[add-text] empty text'); return; }

//     const fontFamily = fontRef.current?.value || 'Raleway';
//     const fontSize = Number(sizeRef.current?.value || 16);

//     await ensureFontLoaded(fontFamily, 400);

//     const tb = new fabric.Textbox(textValue, {
//       fill: color,
//       fontFamily,
//       fontSize,
//       originX: 'center',
//       originY: 'center',
//       left: BASE_W / 2,
//       top: BASE_H / 2,
//       editable: true,
//     });

//     canvas.add(tb);
//     canvas.setActiveObject(tb);
//     canvas.requestRenderAll();
//     console.log('[add-text] added to canvas');

//     userTextsRef.current.push(tb);
//   };

//   const handleRemoveText = () => {
//     console.log('[remove-text] clicked');
//     const canvas = fRef.current;
//     if (!canvas) return;

//     const tb = userTextsRef.current.pop();
//     if (!tb) return;

//     canvas.remove(tb);
//     canvas.requestRenderAll();
//   };

//   /* ===========================
//      Collect Canvas Data
//   =========================== */
//   function collectImageUrls(): string[] {
//     return userImagesRef.current.map((p) => p.src);
//   }

//   function collectTexts() {
//     return userTextsRef.current.map((tb) => ({
//       content: tb.text || '',
//       fontFamily: tb.fontFamily || 'Raleway',
//       fontSize: tb.fontSize || 16,
//       color: (tb.fill as string) || '#000000',
//       left: tb.left || 0,
//       top: tb.top || 0,
//       angle: tb.angle || 0,
//     }));
//   }

//   /* ===========================
//      API Calls
//   =========================== */
//   async function loadDesigns() {
//     console.log('[designs] loading…');
//     setLoadingDesigns(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/designs`, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//         cache: 'no-store',
//       });
//       if (!res.ok) {
//         const txt = await res.text().catch(() => '');
//         throw new Error(`List failed (${res.status}) ${txt}`);
//       }
//       const payload = await res.json();
//       setDesigns(payload?.data || []);
//       console.log('[designs] loaded', payload?.data?.length ?? 0);
//     } catch (e) {
//       console.error('[designs] error:', e);
//     } finally {
//       setLoadingDesigns(false);
//     }
//   }

//   useEffect(() => { loadDesigns(); }, []);

//   async function saveDesign() {
//     console.log('[save] clicked');
//     const canvas = fRef.current;
//     if (!canvas) { console.warn('[save] no canvas'); return; }

//     // Export the design zone only
//     const zonePng = canvas.toDataURL({
//       format: 'png',
//       multiplier: 3,
//       enableRetinaScaling: true,
//     });

//     // OPTIONAL: composite on base (using product photo when available)
//     const base = productBg;
//     let designUrl = zonePng;
//     try {
//       designUrl = await composeDesignOnBase(zonePng, base);
//     } catch (e) {
//       console.warn('[save] compose failed, falling back to zone only:', e);
//     }

//     const imageUrls = collectImageUrls();
//     const texts = collectTexts();

//     try {
//       const res = await fetch(`${API_BASE}/api/designs`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify({
//           designUrl,
//           imageUrls,
//           texts,
//           productName: product?.productName || 'T-Shirt',
//         }),
//       });
//       if (!res.ok) {
//         const txt = await res.text().catch(() => '');
//         throw new Error(`Save failed (${res.status}) ${txt}`);
//       }
//       console.log('[save] success');
//       toast.success("Design Saved");
//       await loadDesigns();
//     } catch (e) {
//       console.error('[save] error:', e);
//       toast.error("Error Saving Design");
//     }
//   }

//   async function deleteDesign(id: string) {
//     try {
//       const res = await fetch(`${API_BASE}/api/designs/${id}`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });
//       if (!res.ok) throw new Error(`Delete failed (${res.status})`);
//       toast.success("Design Deleted")
//       await loadDesigns();
//     } catch (e) {
//       console.error('[delete] error:', e);
//       toast.error("Error deleting Design")
//     }
//   }

//   async function previewDesign() {
//     const canvas = fRef.current;
//     if (!canvas) return;

//     // Export the current zone design
//     const zonePng = canvas.toDataURL({
//       format: 'png',
//       multiplier: 3,
//       enableRetinaScaling: true,
//     });

//     // Composite onto the product background (photoUrl or placeholder)
//     const base = productBg;
//     let finalOut = zonePng;
//     try {
//       finalOut = await composeDesignOnBase(zonePng, base);
//     } catch (e) {
//       console.warn('[preview] compose failed, falling back to zone only:', e);
//     }

//     // Open preview window with composited design
//     const win = window.open('', '_blank');
//     if (win) {
//       win.document.write('<title>Design Preview</title>');
//       win.document.write(
//         `<img src="${finalOut}" style="display:block;max-width:100%;height:auto;" />`
//       );
//       win.document.close();
//     }
//   }

//   /* ===========================
//      UI
//   =========================== */
//   return (
//     <div>
//       <NavBar />

//       <main className="min-h-screen max-md:px-5 mt-10">
//         <div className="mx-auto max-w-[1450px] px-4 sm:px-6 lg:px-2 py-6 ">
//           <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
//             {/* Left panel */}
//             <div className="rounded-xl bg-[#bfcfbf]/65 p-4 sm:p-6 lg:p-8 shadow-md">
//               <h2 className="text-center mb-10  text-4xl font-bold ">Customize Your Product</h2>
//               <div className="mt-6 grid gap-6 xl:grid-cols-2">
//                 <div className="flex flex-col items-center">
//                   {/* Background IMAGE behind, canvas zone above */}
//                   <div className="relative mx-auto w-full max-w-[500px] aspect-[3/4] overflow-hidden rounded-2xl shadow-inner">
//                     {/* product image (z-0, no pointer events) */}
//                     <Image
//                       src={productBg}
//                       alt={product?.productName || 'Product'}
//                       fill
//                       className="object-cover select-none pointer-events-none z-0"
//                       priority
//                       draggable={false}
//                     />

//                     {/* Chest drop zone – responsive, above image */}
//                     <div
//                       ref={zoneRef}
//                       className="
//                         absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2
//                         w-[clamp(150px,45%,260px)]
//                         md:w-[clamp(160px,38%,300px)]
//                         lg:w-[clamp(60px,55%,180px)]
//                         xl:w-[clamp(180px,20%,380px)]
//                         aspect-square rounded border-2 border-dashed border-black/60
//                         z-10
//                       "
//                       style={{ pointerEvents: 'auto' }}
//                     >
//                       <canvas
//                         ref={canvasRef}
//                         className="absolute inset-0 w-full h-full block bg-transparent"
//                         style={{ zIndex: 10, pointerEvents: 'auto' }}
//                       />
//                     </div>
//                   </div>

//                   {/* Save & Preview */}
//                   <div className="flex items-center justify-center gap-10 mt-5">
//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <button
//                           className="grid place-items-center size-9 max-md:size-7 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-colors duration-200"
//                           aria-label="Save and Create New Design"
//                           onClick={saveDesign}
//                         >
//                           <Plus className="h-4 w-4" />
//                         </button>
//                       </TooltipTrigger>
//                       <TooltipContent side="top" className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
//                         Save and Create New Design
//                       </TooltipContent>
//                     </Tooltip>

//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <button
//                           className="grid place-items-center size-9 max-md:size-7 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors duration-200"
//                           aria-label="Preview Design"
//                           onClick={previewDesign}
//                         >
//                           <ZoomIn className="h-4 w-4" />
//                         </button>
//                       </TooltipTrigger>
//                       <TooltipContent side="top" className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
//                         Preview Design
//                       </TooltipContent>
//                     </Tooltip>
//                   </div>
//                 </div>

//                 {/* Tools + product info */}
//                 <div className="flex flex-col gap-3">
//                   <div>
//                     <h2 className="text-xl font-bold text-black">Product Name</h2>
//                     <p className="text-black/70 font-semibold">{product?.productName || '—'}</p>
//                   </div>

//                   <div>
//                     <h2 className="text-xl font-bold text-black">Selected Size</h2>
//                     <p className="text-black/70 font-semibold">
//                       {paraSize}
//                     </p>
//                   </div>

//                   <div>
//                     <h2 className="text-xl font-bold text-black">Selected Color</h2>
//                     <p className="text-black/70 font-semibold">
//                       {paramColor}
//                     </p>
//                   </div>

//                   {/* Add Image */}
//                   <div className="gap-2 flex flex-col">
//                     <h2 className="text-xl font-bold text-black">Add Image</h2>
//                     <div className="flex justify-between max-lg:justify-start gap-5">
//                       <label
//                         htmlFor="image-selector"
//                         className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-200 transition-all duration-300 cursor-pointer border"
//                       >
//                         <Upload className="h-4 w-4" /> Choose File
//                         <input
//                           type="file"
//                           className="hidden"
//                           id="image-selector"
//                           ref={fileInputRef}
//                           onChange={async (e) => {
//                             const el = e.currentTarget;
//                             const f = el.files?.[0];
//                             if (!f) return;
//                             await unsafeUploadRawFileAndOpen(f);
//                             el.value = "";
//                           }}
//                           // accept="image/*"
//                         />
//                       </label>

//                       <Buttons context="REMOVE IMAGE" combo="redTransparent" icon={X} onClick={handleRemoveImage} />
//                     </div>
//                   </div>


//                   {/* Add Text */}
//                   <div className="gap-2 flex flex-col">
//                     <h2 className="text-xl font-bold text-black">Add Text</h2>
//                     <div className="flex justify-between flex-col max-lg:justify-start gap-5">
//                       <input
//                         type="text"
//                         placeholder="Type your Text"
//                         ref={textInputRef}
//                         className="border h-10 bg-white/60 max-lg:w-fit placeholder:font-normal font-semibold placeholder:text-black p-3 text-md"
//                       />
//                       <div className="flex flex-wrap gap-3 justify-between max-lg:justify-start">
//                         <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
//                           <span className="text-sm text-gray-700">Font</span>
//                           <span className="text-gray-400">|</span>
//                           <select ref={fontRef} className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer" defaultValue="Raleway">
//                             <option value="Raleway">Raleway</option>
//                             <option value="Montserrat">Montserrat</option>
//                             <option value="Poppins">Poppins</option>
//                           </select>
//                         </div>

//                         <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
//                           <select ref={sizeRef} className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer" defaultValue="16">
//                             <option value="12">12</option>
//                             <option value="14">14</option>
//                             <option value="16">16</option>
//                             <option value="20">20</option>
//                             <option value="24">24</option>
//                           </select>
//                           <span className="text-gray-400">|</span>
//                           <span className="text-sm text-gray-700">px</span>
//                         </div>
//                       </div>

//                       {/* color for new text */}
//                       <input
//                         type="color"
//                         className="w-full max-lg:w-[300px]"
//                         value={color}
//                         onChange={(e) => setColor(e.target.value)}
//                       />

//                       <div className="flex justify-between max-lg:justify-start gap-5">
//                         <span onClick={handleAddText}>
//                           <Buttons context="ADD TEXT" icon={Type} />
//                         </span>
//                         <span onClick={handleRemoveText}>
//                           <Buttons context="REMOVE TEXT" icon={X} combo="redTransparent" />
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Cart Button (optional wiring) */}
//                   <div className="flex justify-end mt-20 text-sm">
//                     <Buttons context="ADD TO CART" icon={ShoppingCart} productId={product?.productId} size={paraSize}/>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right panel */}
//             <div className="rounded-xl bg-[#e1dacc] p-4 sm:p-6 lg:p-8 shadow-md">
//               <h2 className="text-center text-2xl font-bold underline">Previous Designs</h2>

//               <div className="mt-5 space-y-4">
//                 {loadingDesigns && <div className="text-sm text-gray-600">Loading designs…</div>}
//                 {!loadingDesigns && designs.length === 0 && (
//                   <div className="text-sm text-gray-600">No designs yet.</div>
//                 )}

//                 {designs.map((d) => (
//                   <div key={d._id} className="w-full max-w-xl rounded-lg bg-white/60 p-4 sm:p-5 shadow-sm">
//                     <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 sm:gap-5 items-start">
//                       <div className="relative h-[140px] w-full sm:w-[150px] overflow-hidden rounded-md">
//                         <Image src={d.designUrl} alt="Previous Design" fill className="object-cover" />
//                       </div>

//                       <div className="flex flex-col gap-3 min-w-[250px]">
//                         <div>
//                           <p className="font-semibold text-sm sm:text-base">
//                             Product Name : <span className="font-normal">{d.productName || 'T-Shirt'}</span>
//                           </p>
//                           <p className="font-semibold text-sm sm:text-base">
//                             Created At : <span className="font-normal">{new Date(d.createdAt).toLocaleDateString()}</span>
//                           </p>
//                         </div>

//                         {/* ===== (Optional) UNSAFE-VULN: expose raw design URL if you ever stored one =====
//                         NOTE: Your current backend stores PNG data URLs only; this link is safe/no-op now.
//                         Keeping it commented to avoid confusion.
//                         <a className="text-xs text-red-700 underline" href={d.designUrl} target="_blank" rel="noopener noreferrer">
//                           Open raw designUrl
//                         </a>
//                         ===== END ===== */}

//                         <div className="mt-1 sm:mt-2 flex sm:justify-end gap-3">
//                           <Buttons
//                             context="DELETE DESIGN"
//                             icon={X}
//                             combo="redTransparent"
//                             onClick={() => deleteDesign(d._id)}
//                           />
//                           <Buttons context="ADD TO CART" icon={ShoppingCart} />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             {/* End right panel */}
//           </div>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default CustomizationPage;
