import Image from 'next/image'
import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const HeroSection = () => {
  return (
    <div className="flex flex-col md:flex-row items-stretch relative w-full max-md:mt-10 md:h-[560px] max-md:p-3">
  {/* Left panel */}
  <div className="flex flex-col gap-4 md:gap-6 bg-[#D9EAD6] w-full md:w-1/2 justify-center items-center px-6 py-10 md:p-10 text-black">
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
  <div className="relative w-full md:w-1/2 h-[260px] sm:h-[340px] md:h-full">
    {/* Next/Image with cover */}
    <Carousel className="w-full">
          <CarouselContent>
            {[1,2,3].map((n) => (
              <CarouselItem key={n} className="basis-full">
                <div className="h-48 border rounded-2xl grid place-items-center">
                  Slide {n}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
  </div>
</div>

  )
}

export default HeroSection