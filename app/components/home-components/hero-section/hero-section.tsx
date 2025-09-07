'use client';
import Image from 'next/image'
import React from 'react'
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import PrimaryButton from '../../common-components/primary-button';
import { Brush } from 'lucide-react';
import Link from 'next/link';

const HeroSection = () => {

  const sliderImages = [
    '/assets/images/hero_image_1.jpg',
    '/assets/images/hero_image_2.jpg',
    '/assets/images/hero_image_3.jpg',
    '/assets/images/hero_image_4.jpg'
  ]

  return (

    // Need to fix the responsiveness
    
      <div className="flex flex-col md:flex-row items-stretch bg-[#6a9563] relative w-full max-md:mt-10
                      md:h-[560px] ">
        {/* Left panel */}
        <div className="flex flex-col gap-4 md:gap-6 w-full h-full md:w-1/3 min-w-0 justify-center
+                 items-center px-6 py-10 text-black ">
          <h2 className="font-semibold leading-tight
                        text-3xl sm:text-4xl md:text-5xl max-lg:text-5xl lg:text-6xl max-md:text-center">
            LET’S <br className="hidden sm:block" />
            EXPLORE <br className="hidden sm:block" />
            UNIQUE <br className="hidden sm:block" />
            CLOTHES
          </h2>
          <p className="text-base md:text-lg font-semibold">Create Your Own STYLE</p>
          <Link href="/Customization"><PrimaryButton context = "Start Customizing" icon={Brush}/></Link>
        </div>

        {/* Right media panel */}
        <div className="relative w-full md:w-2/3 h-[260px] sm:h-[340px] md:h-full overflow-hidden ">
          {/* Next/Image with cover */}
            <Carousel className='relative w-full h-full'  plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}>
                <CarouselContent>
                  {sliderImages.map((image,key) => (
                    <CarouselItem key={key} className="basis-full">
                      <Image src={image} alt='Hero Image'  width={600} height={900} className='w-700 max-md:w-400
                               max-md:h-100 h-200 object-fill' />
                    </CarouselItem>
                  ))}
                  
                </CarouselContent>
                <CarouselPrevious className='absolute  cursor-pointer border-dark-green border-2 bg-beige 
                                          text-dark-green top-[95%] left-[40%] transform  z-[500]'/>
                <CarouselNext className='absolute  cursor-pointer border-dark-green border-2
                                      bg-beige text-dark-green top-[95%] left-[60%] transform  z-[500]'/>
              </Carousel>
        </div>
      </div>
   
  )
}

export default HeroSection