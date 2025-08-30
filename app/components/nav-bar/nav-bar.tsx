"use client";
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from "lucide-react";

const NavBar = () => {

  const newArrivalItems = ["Men" , "Women" , "Kids"];
  const otherItems = ["Undergarment" , "Casual Wear" , "Night Wear"];

  const[openTop,setOpenTop] = useState(false);
  const[openBottom,setOpenBottom] = useState(false);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const [dropdownA, setDropdownA] = useState(false);
  const [dropdownB, setDropdownB] = useState(false);
  const [dropdownC, setDropdownC] = useState(false);
  const [dropdownD, setDropdownD] = useState(false);
  
  useEffect(() => {
    if (openBottom && bottomScrollRef.current) {
      try {
        bottomScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
      } catch {
        bottomScrollRef.current.scrollLeft = 0;
      }
    }
  }, [openBottom]);


  return (
    <nav className='flex justify-center items-center w-screen flex-wrap gap-2 overflow-visible top-navbar'>

      <div className='flex items-center justify-between min-w-screen border-b-2 px-10 h-[110px] max-md:h-[130px] max-md:p-3 max-md:gap-5 max-md:px-5 max-md:justify-around'>

          <div className='flex items-center gap-30 w-fit h-fit max-w-screen-lg mx-4 max-md:gap-20 '>
            <Image src='/assets/logo.jpg' alt='Logo' width={60} height={60} className='max-md:w-12'/>
            <h2 className='min-w-0 font-charm text-dark-green leading-tight text-xl sm:text-2xl lg:text-3xl [text-wrap:balance] max-w-[min(60ch,100%)] flex '>Design your style, wear your identity ✨</h2>
          </div>

          <div className={`flex items-start justify-center gap-20 md:relative md:min-h-auto md:transition-none max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:min-w-60 max-md:bg-beige max-md:transition-transform max-md:duration-500 max-md:ease-in-out ${openTop ? "max-md:translate-x-0 max-md:opacity-100 z-1000 max-md:text-md max-sm:text-sm" : "max-md:translate-x-full max-md:opacity-0"}`}>
            <div className='flex md:flex-row flex-col max-md:items-center items-center md:gap-[4vw] gap-8 max-md:mt-9'>
            <button
            className="block md:hidden ml-4 cursor-pointer"
            onClick={() => setOpenTop(!openTop)}
            >
            <X size={32} /> 
            </button>
            <div className={`gap-6 relative w-[250px] max-md:w-50 `}>
              <input
                type="text"
                placeholder="Search Here"
                className="w-full h-10 border-light-green outline-0 border-2 pr-10 pl-4 rounded-2xl placeholder:text-l font-bold placeholder:text-dark-green "
              />
              <Image
                src="/assets/search_icon.svg"
                alt="Search-Icon"
                width={20}
                height={20}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              />
            </div>

            <div className='flex relative flex-shrink-0 w-fit h-fit gap-5'>
              <p className={` text-dark-green font-bold ${openTop ? 'flex' : 'hidden'}`}>Cart page</p>
              <Image src='/assets/Shopping_cart.svg' alt='Cart-Icon' width={28} height={25}/>
              <span className="absolute -top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full bg-light-green text-white text-sm font-bold">0</span>
            </div>
            <div className='flex items-center gap-3 mr-3'>
              <p className='text-dark-green font-bold underline'> Login /
              Sign Up</p>
              <Image src='/assets/account_circle.svg' alt='Account-Icon' width={32} height={32}/>
            </div>
          </div>
          </div>
            <button
            className="block md:hidden ml-4 cursor-pointer"
            onClick={() => setOpenTop(!openTop)}
            > 
            <Menu size={32} />
            </button>
            
      </div>
      
      
        <div className='flex items-center relative justify-start w-screen gap-4 sm:gap-6 md:gap-10 px-4 sm:px-6 md:px-10 text-l '>
        {!openBottom && (
          <button
            aria-label="Open menu"
            className="relative z-30 block  md:hidden ml-4 md:h-10 h-8 sm:h-9 cursor-pointer"
            onClick={() => setOpenBottom(true)}
          > 
            <Menu className="w-5 h-5 min-[414px]:w-6 min-[414px]:h-6 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          </button>
        )}
          <div className={`flex items-start shrink justify-start gap-3 sm:gap-5 md:gap-10 max-[550px]:gap-2 flex-nowrap md:relative  max-md:h-fit md:transition-none max-md:fixed max-md:inset-x-0 max-md:left-0 max-md:top-[144px] max-md:w-full max-md:min-w-0  min-h-8 sm:min-h-9 md:min-h-10 z-50 max-[413px]:overflow-x-auto min-[420px]:overflow-x-visible overflow-y-visible overscroll-x-contain no-scrollbar touch-pan-x scroll-smooth max-md:transition-transform max-md:duration-500 max-md:ease-in-out ${openBottom ? "max-md:translate-x-0 max-md:opacity-100" : "max-md:-translate-x-full max-md:opacity-0"}`}>
            {openBottom && (
              <button
                aria-label="Close menu"
                className="inline-flex md:hidden items-center justify-center h-8 sm:h-9 md:h-10 cursor-pointer flex-none px-7 z-30"
                onClick={() => setOpenBottom(false)}
              > 
                <X className="w-6 h-6 min-[414px]:w-7 min-[414px]:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </button>
            )}
            <div className='flex flex-col items-center relative shrink-0 w-36 md:w-40 max-[413px]:min-w-[9.5rem] min-[414px]:w-auto min-[414px]:flex-1 min-[414px]:basis-0 min-[414px]:min-w-0 min-[414px]:shrink gap-1 sm:gap-2'>
              <div className='flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10' onClick={() => setDropdownA(!dropdownA)}>
                <p className='text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none'>New Arrivals</p>
                <Image src={dropdownA ? '/assets/arrow_up.svg' : '/assets/arrow_down.svg'} alt='Cart-Icon' width={16} height={16} className='transition-all duration-300 ease-in-out'/>
              </div>
              <ul className={`bg-[#eae5dd] w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center  transition-[max-height,opacity,transform] duration-300 ease-out ${
              dropdownA ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
              >
              {newArrivalItems.map((item, key) => (
                <li key={key} className={`text-[10px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${item == "Men" ? 'rounded-t-lg' : ''} ${item == "Kids" ? 'rounded-b-lg' : ''}`}>{item}</li>
              ))}
              </ul>
              
            </div>

            <div className='flex flex-col items-center relative shrink-0 w-36 md:w-40 max-[413px]:min-w-[9.5rem] min-[414px]:w-auto min-[414px]:flex-1 min-[414px]:basis-0 min-[414px]:min-w-0 min-[414px]:shrink gap-1 sm:gap-2 '>
              <div className='flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10' onClick={() => setDropdownB(!dropdownB)}>
                <p className='text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none'>Men</p>
                <Image src={dropdownB ? '/assets/arrow_up.svg' : '/assets/arrow_down.svg'} alt='Cart-Icon' width={16} height={16} className='transition-all duration-300 ease-in-out'/>
              </div>
              <ul className={`bg-[#eae5dd] w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
              dropdownB ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
              >
              {otherItems.map((item, key) => (
                <li key={key} className={`text-[10px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${item == "Undergarment" ? 'rounded-t-lg' : ''} ${item == "Night Wear" ? 'rounded-b-lg' : ''}`}>{item}</li>
              ))}
              </ul>
            </div>

            <div className='flex flex-col items-center relative shrink-0 w-36 md:w-40 max-[413px]:min-w-[9.5rem] min-[414px]:w-auto min-[414px]:flex-1 min-[414px]:basis-0 min-[414px]:min-w-0 min-[414px]:shrink gap-1 sm:gap-2'>
              <div className='flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10' onClick={() => setDropdownC(!dropdownC)}>
                <p className='text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none'>Women</p>
                <Image src={dropdownC ? '/assets/arrow_up.svg' : '/assets/arrow_down.svg'} alt='Cart-Icon' width={16} height={16} className='transition-all duration-300 ease-in-out'/>
              </div>
              <ul className={`bg-[#eae5dd] w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
              dropdownC ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
              >
              {otherItems.map((item, key) => (
                <li key={key} className={`text-[10px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${item == "Undergarment" ? 'rounded-t-lg' : ''} ${item == "Night Wear" ? 'rounded-b-lg' : ''}`}>{item}</li>
              ))}
              </ul>
            </div>


            <div className='flex flex-col items-center relative shrink-0 w-36 md:w-40 max-[413px]:min-w-[9.5rem] min-[414px]:w-auto min-[414px]:flex-1 min-[414px]:basis-0 min-[414px]:min-w-0 min-[414px]:shrink gap-1 sm:gap-2'>
              <div className='flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10' onClick={() => setDropdownD(!dropdownD)}>
                <p className='text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none'>Kids</p>
                <Image src={dropdownD ? '/assets/arrow_up.svg' : '/assets/arrow_down.svg'} alt='Cart-Icon' width={16} height={16} className='transition-all duration-300 ease-in-out'/>
              </div>
              <ul className={`bg-[#eae5dd] w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
              dropdownD ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
              >
              {otherItems.map((item, key) => (
                <li key={key} className={`text-[10px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${item == "Undergarment" ? 'rounded-t-lg' : ''} ${item == "Night Wear" ? 'rounded-b-lg' : ''}`}>{item}</li>
              ))}
              </ul>
            </div>
            
            </div>
      </div>
    </nav>
  )
}

export default NavBar;
