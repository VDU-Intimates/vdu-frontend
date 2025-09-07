'use client';
import {Plus, ShoppingCart, Type, Upload, X, ZoomIn } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import * as fabric from "fabric";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Buttons from '../components/common-components/button'
import Image from 'next/image';
import Footer from '../components/footer/footer';
import NavBar from '../components/nav-bar/nav-bar';


function hasFontFaceSet(d: Document): d is Document & { fonts: FontFaceSet } {
  // feature detection without using `any`
  return typeof (d as Document & Partial<{ fonts: FontFaceSet }>).fonts !== "undefined";
}

export async function ensureFontLoaded(family: string, weight = 400): Promise<void> {
  if (typeof document === "undefined") return; // SSR guard
  if (!hasFontFaceSet(document)) return;       // browser doesn’t support CSS Font Loading API

  const { fonts } = document;                  // fonts: FontFaceSet
  try {
    await fonts.load(`${weight} 16px ${family}`);
    await fonts.ready;
  } catch {
    // swallow errors; just proceed
  }
}

const CustomizationPage = () => {

//base width and height of the canvas
const BASE_W = 200;
const BASE_H = 200;

//color bar
const [color, setColor] = useState("#255384");

//Text Ref
const textInputRef = useRef<HTMLInputElement | null>(null);
const fontRef = useRef<HTMLSelectElement | null>(null);
const sizeRef = useRef<HTMLSelectElement | null>(null);
// keep track of added text objects (so you can remove last)
const userTextsRef = useRef<fabric.Textbox[]>([]);
const userImagesRef = useRef<fabric.Image[]>([]); // track fabric images you add
//Image Ref
const fileInputRef = useRef<HTMLInputElement | null>(null);
const zoneRef = useRef<HTMLDivElement | null>(null);
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const fRef = useRef<fabric.Canvas | null>(null);


useEffect(() => {
  const el = canvasRef.current;
  const zone = zoneRef.current;
  if (!el || !zone) return;

  // Initialize once at base (internal) size

  
  const canvas = new fabric.Canvas(el);
  fRef.current = canvas;
  canvas.setDimensions({ width: BASE_W, height: BASE_H });

  // Sync only the CSS size on resize (keeps internal coords = BASE_W×BASE_H)
  const sync = () => {
    const w = Math.round(zone.clientWidth);
    const h = Math.round(zone.clientHeight);
    canvas.setDimensions({ width: w, height: h }, { cssOnly: true }); // <-- important
    canvas.requestRenderAll();
    canvas.calcOffset();
  };

  sync();
  const ro = new ResizeObserver(sync);
  ro.observe(zone);

  return () => {
    ro.disconnect();
    canvas.dispose();
    fRef.current = null;
  };
}, []);

  // Image Adding Function
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = fRef.current;
    if (!canvas) return;
  
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.readAsDataURL(file);
  
    reader.onload = async (ev: ProgressEvent<FileReader>) => {
      const url = ev.target?.result;
      if (typeof url !== "string") return;
  
      // Fabric v5: promise-based
      const img = await fabric.Image.fromURL(url, { crossOrigin: "anonymous" });
  
      // Fit into BASE size so controls stay visible (padding = 90%)
      const padding = 0.9;
      const scale = Math.min(
        (BASE_W * padding) / (img.width || BASE_W),
        (BASE_H * padding) / (img.height || BASE_H)
      );
  
      
      img.set({
        originX: "center",
        originY: "center",
        left: BASE_W / 2,
        top: BASE_H / 2,
      });
      img.scale(scale);
  
      canvas.add(img);

      img.set({
        borderColor: "#306D42",
        cornerColor: "#306D42",
        cornerSize: 11,
        cornerStyle: "rectangle",
        transparentCorners: false,
      });
      canvas.setActiveObject(img);
      
      canvas.requestRenderAll();

      userImagesRef.current.push(img);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  //Image Remove Function
  const handleRemoveImage = () =>{
    
    const canvas = fRef.current;
  if (!canvas) return;

  const img = userImagesRef.current.pop();
  if (!img) return;

  canvas.remove(img);
  
  (img as fabric.FabricImage).dispose?.();
  canvas.requestRenderAll();

  // clear input so user can choose the same file again
  if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleAddText = async () => {
    const canvas = fRef.current;
    if (!canvas) return;

    const textValue = textInputRef.current?.value?.trim() || '';
    if (!textValue) return;

    // Default to Raleway font
    const fontFamily = fontRef.current?.value || 'Raleway';
    const fontSize = Number(sizeRef.current?.value || 16);

    // Ensure the selected font is loaded before creating the Fabric object
    await ensureFontLoaded(fontFamily, 400);

    const tb = new fabric.Textbox(textValue, {
      fill: color,
      fontFamily, // "Raleway" | "Montserrat" | "Poppins"
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

    userTextsRef.current.push(tb);
  };

  const handleRemoveText = () => {
    const canvas = fRef.current;
    if (!canvas) return;

    const tb = userTextsRef.current.pop();
    if (!tb) return;

    canvas.remove(tb);
    canvas.requestRenderAll();
  };
  

  return (
    <div>
      <NavBar />
    {/* Main wrapper */}
    <main className='min-h-screen max-md:px-5 mt-10'>
      {/* Left panel + Right Panel wrapper */}
      <div className='mx-auto max-w-[1450px] px-4 sm:px-6 lg:px-2 py-6 '>
        <div className='grid gap-10 lg:grid-cols-[2fr_1fr]'>
          {/* Left panel */}
          <div className='rounded-xl bg-[#bfcfbf]/65 p-4 sm:p-6 lg:p-8 shadow-md'>
              <h2 className='text-center mb-10  text-4xl font-bold '>Customize Your Product</h2>
              <div className='mt-6 grid gap-6 xl:grid-cols-2'>
                <div className='flex flex-col items-center'>
                  {/* Canvas */}
                  <div
                    className="
                      relative mx-auto w-full
                      max-w-[500px]   
                      aspect-[3/4] overflow-hidden rounded-2xl
                      bg-[url('/assets/images/placeholder-tshirt.jpg')]
                      bg-cover bg-center shadow-inner">
                    {/* Chest drop zone – proportional, responsive, capped */}
                    <div
                      ref={zoneRef}
                      className="
                        absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2
                        w-[clamp(150px,45%,260px)]
                        md:w-[clamp(160px,38%,300px)]
                        lg:w-[clamp(60px,55%,180px)]
                        xl:w-[clamp(180px,20%,380px)]
                        aspect-square rounded border-2 border-dashed border-black/60">
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block bg-transparent" />
                    </div>
                  </div>
                  {/* zoom and plus icons */}
                  <div className='flex items-center justify-center gap-10 mt-5'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="
                              grid place-items-center size-9 max-md:size-7
                              rounded-full border-2 border-gray-200
                              bg-white text-gray-700 shadow-sm
                              hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer hover:text-emerald-600
                              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
                              transition-colors duration-200
                            "
                            aria-label="Save and Create New Design"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="
                            rounded-md bg-gray-900 px-2.5 py-1.5
                            text-xs text-white shadow-lg
                            animate-in fade-in-50
                          "
                        >
                          Save and Create New Design
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="
                              grid place-items-center size-9 max-md:size-7
                              rounded-full border-2 border-gray-200
                              bg-white text-gray-700 shadow-sm
                              hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer hover:text-indigo-600
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                              transition-colors duration-200
                            "
                            aria-label="Preview Design"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="
                            rounded-md bg-gray-900 px-2.5 py-1.5
                            text-xs text-white shadow-lg
                            animate-in fade-in-50
                          "
                        >
                          Preview Design
                        </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {/* Customization Tools*/}
                <div className='flex flex-col gap-3'>
                  {/* Product Name */}
                  <div>
                    <h2 className='text-xl font-bold text-black'>Product Name</h2>
                    <p className="text-black/70 font-semibold">T-Shirt</p>
                  </div>
                  
                  {/* Add Image */} 
                  <div className='gap-2 flex flex-col'>
                    <h2 className='text-xl font-bold text-black'>Add Image</h2>
                      <div className='flex justify-between max-lg:justify-start gap-5'>
                        <label htmlFor='image-selector' className="inline-flex items-center gap-2 rounded-xl
                                         bg-gray-50 px-3 py-2 text-sm font-medium border-1
                                           shadow-sm hover:bg-gray-200 transition-all duration-300 cursor-pointer">
                          <Upload className="h-4 w-4" /> Choose File
                          <input type="file" className="hidden" id='image-selector' ref={fileInputRef} onChange={handleAddImage}/>
                        </label>

                        <Buttons context='REMOVE IMAGE' combo='redTransparent' icon={X} onClick={handleRemoveImage}/>
                      </div>
                  </div>

                  {/* Add Text */} 
                  <div className='gap-2 flex flex-col'>
                    <h2 className='text-xl font-bold text-black'>Add Text</h2>
                      <div className='flex justify-between flex-col max-lg:justify-start gap-5'>
                        <input type="text" placeholder='Type your Text' ref={textInputRef}
                                className='border-1 h-10 bg-white/60 max-lg:w-fit placeholder:font-normal
                                           font-semibold placeholder:text-black p-3 text-md'/>
                        {/* Font and size Selector */}
                        <div className="flex flex-wrap gap-3 justify-between max-lg:justify-start">
                          {/* Font Selector */}
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
                            <span className="text-sm text-gray-700">Font</span>
                            <span className="text-gray-400">|</span>
                            <select ref={fontRef}
                              className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer"
                              defaultValue="Raleway"
                            >
                              <option value="Raleway">Raleway</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Poppins">Poppins</option>
                            </select>
                          </div>

                          {/* Size Selector */}
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm border">
                            <select ref={sizeRef}
                              className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer"
                              defaultValue="16"
                            >
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

                        {/*color Selector */}
                        <input type="color" className='w-full max-lg:w-[300px]' value={color} 
                                  onChange={(e) => setColor(e.target.value) }/>
                        <div className='flex justify-between max-lg:justify-start gap-5'>
                          <span onClick={handleAddText} >
                          <Buttons context='ADD TEXT' icon={Type} />
                          </span>
                          <span onClick={handleRemoveText} >
                          <Buttons context='REMOVE TEXT' icon={X} combo='redTransparent'/>
                          </span>
                        </div>
                      </div>
                  </div>
                    {/* Cart Button */}
                  <div className='flex justify-end mt-20 text-sm'>
                  <Buttons context='ADD TO CART' icon={ShoppingCart} />
                  </div>
                </div>
              </div>
          </div>


          {/* Right panel */}
          <div className="rounded-xl bg-[#e1dacc] p-4 sm:p-6 lg:p-8 shadow-md">
            <h2 className="text-center text-2xl font-bold underline">Previous Designs</h2>

            {/* list wrapper */}
            <div className="mt-5 space-y-4">
              {/* one design card */}
              <div className="w-full max-w-xl rounded-lg bg-white/60 p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 sm:gap-5 items-start">
                  {/* image */}
                  <div className="relative h-[140px] w-full sm:w-[140px] overflow-hidden rounded-md">
                    <Image
                      src="/assets/images/product_image_1.jpg"
                      alt="Previous Design"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* details + button */}
                  <div className="flex flex-col gap-3 min-w-[250px]">
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Product Name : <span className="font-normal">T-Shirt</span>
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        Created At : <span className="font-normal">2003-08-25</span>
                      </p>
                    </div>

                    {/* Cart Button */}
                    <div className="mt-1 sm:mt-2 flex sm:justify-end  gap-3">
                      <Buttons
                        context="DELETE DESIGN"
                        icon={X}
                        combo='redTransparent'
                      />
                      <Buttons
                        context="ADD TO CART"
                        icon={ShoppingCart}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </div>
  )
}

export default CustomizationPage