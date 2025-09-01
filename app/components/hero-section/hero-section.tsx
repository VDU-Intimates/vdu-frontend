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

const HeroSection = () => {

  const sliderImages = [
    '/assets/hero_image_1.jpg',
    '/assets/hero_image_2.jpg',
    '/assets/hero_image_3.jpg',
    '/assets/hero_image_4.jpg'
  ]

  return (

    // Need to fix the responsiveness
    <div className="flex flex-col md:flex-row items-stretch relative w-full max-md:mt-10
                     md:h-[560px] px-10 max-md:p-3">
      {/* Left panel */}
      <div className="flex flex-col gap-4 md:gap-6 bg-[#D9EAD6] w-full h-full md:w-1/2 justify-center
                       items-center px-6 py-10 md:p-10 text-black">
        <h2 className="font-semibold leading-tight
                      text-3xl sm:text-4xl md:text-6xl lg:text-7xl">
          LET’S <br className="hidden sm:block" />
          EXPLORE <br className="hidden sm:block" />
          UNIQUE <br className="hidden sm:block" />
          CLOTHES
        </h2>
        <p className="text-base sm:text-lg">Create Your Own STYLE</p>
      </div>

      {/* Right media panel */}
      <div className="relative w-full md:w-1/2 h-[260px] sm:h-[340px] md:h-full overflow-hidden ">
        {/* Next/Image with cover */}
        <Carousel  plugins={[
            Autoplay({
              delay: 2000,
            }),
          ]}>
              <CarouselContent>
                {sliderImages.map((image,key) => (
                  <CarouselItem key={key} className="basis-full">
                    <Image src={image} alt='Hero Image'  width={600} height={900} className='w-700 h-200 object-fill' />
                  </CarouselItem>
                ))}
              </CarouselContent>

            </Carousel>
      </div>
    </div>

  )
}

export default HeroSection