import Image from 'next/image'
import React from 'react'


const widths = {
    xs: "w-[200px]",
    sm: "w-[300px]",
    md: "w-[400px]",
    lg: "w-[500px]",
  }as const;

type size = keyof typeof widths 

type SearchBarProps = {
    size:size
}

const SearchBar = ({size} : SearchBarProps) => {

  return (
    <div
      className={`relative cursor-pointer gap-6
                 ${widths[size]}
                 max-md:w-[180px]`}           
    >
      <input
        type="text"
        placeholder="Search Here"
        className="w-full h-10 border-light-green outline-0 border-2 pr-10 pl-4 rounded-2xl
                   placeholder:text-sm font-bold placeholder:text-dark-green"
      />
      <Image
        src="/assets/icons/search_icon.svg"
        alt="Search-Icon"
        width={20}
        height={20}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      />
    </div>
  )
}

export default SearchBar