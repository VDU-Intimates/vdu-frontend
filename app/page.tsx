
'use client';
import Footer from "./components/footer/footer";
import BestSelling from "./components/home-components/best-selling-section/best-selling-section";
import HeroSection from "./components/home-components/hero-section/hero-section";
import NavBar from "./components/nav-bar/nav-bar";

export default function Home() {
  return (

    <div>
      <NavBar />
    
    <div className="max-md:px-5 px-10 mt-10">
      
      <HeroSection />
      <BestSelling />
      
    </div>
    <Footer />
    </div>
  );
}
