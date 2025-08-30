import Image from "next/image";

export default function Home() {
  return (


    <div className="min-h-screen">
      <div className="">
        <div>
          <h2>
          LET’S EXPLORE UNIQUE CLOTHES
          </h2>
          <p>
            Create Your Own STYLE
          </p>
        </div>
        <div>
          <Image src="/assets/hero_image.jpg" alt="Hero Image " width={750} height={750} />
        </div>
      </div>
    </div>
  );
}
