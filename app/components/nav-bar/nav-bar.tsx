'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "../common-components/search-bar";

// API base for your backend
const API_BASE = "http://localhost:5000";

// Types that match /api/auth/me
type ApiUser = {
  userId: string;
  fName: string;
  lName: string;
  email: string;
};

// Helper to safely get the auth token
function getToken(): string {
  try {
    const raw = localStorage.getItem("access_token");
    return raw?.trim() || "";
  } catch {
    return "";
  }
}

const NavBar = () => {
  const pathname = usePathname();
  const router = useRouter();

  // State for UI
  const [openTop, setOpenTop] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  
  // State for authentication and search
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Search Handler ---
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from reloading the page
    if (!searchTerm.trim()) return; // Don't search if the input is empty
    
    // Navigate to the All Products page with the search query
    router.push(`/AllProducts?search=${encodeURIComponent(searchTerm)}`);
  };

  // --- Authentication and Cart Logic ---
  const refreshCartCount = async (token: string) => {
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCartCount(data?.items?.length || 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    const loadUserAndCart = async () => {
      const token = getToken();
      if (!token) {
        setCurrentUser(null);
        setCartCount(0);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data: { user: ApiUser } = await res.json();
        setCurrentUser(data.user);
        await refreshCartCount(token);
      } catch {
        setCurrentUser(null);
        setCartCount(0);
      }
    };

    loadUserAndCart();
    
    // Listen for custom events to update auth/cart status from other components
    const handleAuthUpdate = () => loadUserAndCart();
    window.addEventListener("auth:updated", handleAuthUpdate);
    window.addEventListener("cart:updated", () => refreshCartCount(getToken()));

    return () => {
      window.removeEventListener("auth:updated", handleAuthUpdate);
      window.removeEventListener("cart:updated", () => refreshCartCount(getToken()));
    };
  }, [pathname]); // Reload user info on route change

  const displayFirstName = currentUser?.fName || currentUser?.email?.split("@")[0];

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    setCurrentUser(null);
    setUserMenuOpen(false);
    // Use router for smoother navigation
    router.push('/');
  };

  return (
    <nav className="flex justify-center items-center w-screen flex-wrap gap-2 overflow-visible border-b-2">
      {/* Top Navbar */}
      <div className="flex items-center justify-between w-full px-4 sm:px-10 h-[110px]">
        <div className="flex items-center gap-4 sm:gap-10 md:gap-20">
          <Link href="/" className="shrink-0">
            <Image
              src="/assets/icons/logo.jpg"
              alt="Logo"
              width={60}
              height={60}
            />
          </Link>
          {/* Search form that wraps the SearchBar */}
          <form onSubmit={handleSearchSubmit}>
            <SearchBar 
              size="md" 
              value={searchTerm} 
              onSearchChange={setSearchTerm} 
            />
          </form>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-[4vw]">
          <Link href="/AllProducts" className="nav-link">All Products</Link>
          <Link href="/BulkOrder" className="nav-link">Bulk Order</Link>
          <Link href="/contact" className="nav-link">Contact Us</Link>
          <Link href="/AboutUs" className="nav-link">About Us</Link>

          {/* Cart Icon */}
          <Link href="/cart" className="relative">
            <Image
              src="/assets/icons/Shopping_cart.svg"
              alt="Cart"
              width={32}
              height={25}
            />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-light-green text-white text-xs font-bold">
              {cartCount}
            </span>
          </Link>

          {/* Auth Section */}
          {currentUser ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(s => !s)} className="auth-button">
                <span className="avatar">
                  {(currentUser.fName || currentUser.email)[0].toUpperCase()}
                </span>
                <span className="hidden sm:block">{displayFirstName?.toUpperCase()}</span>
              </button>
              {userMenuOpen && (
                <div className="user-menu">
                  <Link href="/OrderHistory" className="user-menu-item">Order history</Link>
                  <Link href="/TrackOrder" className="user-menu-item">Track orders</Link>
                  <Link href="/Profile" className="user-menu-item">Account management</Link>
                  <Link href="/CustomizationReport" className="user-menu-item">Design Reports</Link>
                  <div className="my-1 border-t border-neutral-200" />
                  <button onClick={handleSignOut} className="user-menu-item-danger">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/Login" className="login-link">
              <p>Login / Sign Up</p>
              <Image src="/assets/icons/account_circle.svg" alt="Account" width={32} height={32} />
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <button className="block md:hidden" onClick={() => setOpenTop(true)}>
          <Menu size={32} />
        </button>
      </div>

      {/* Mobile Off-canvas Menu */}
      <div className={`fixed inset-y-0 right-0 w-60 bg-beige z-[1000] transform transition-transform duration-300 ease-in-out ${openTop ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5">
          <button className="mb-8" onClick={() => setOpenTop(false)}><X size={32} /></button>
          <div className="flex flex-col items-center gap-6">
            <Link href="/AllProducts" className="nav-link-mobile">All Products</Link>
            <Link href="/BulkOrder" className="nav-link-mobile">Bulk Order</Link>
            <Link href="/contact" className="nav-link-mobile">Contact Us</Link>
            <Link href="/AboutUs" className="nav-link-mobile">About Us</Link>
            <div className="w-full border-t border-gray-300 my-4" />
            {/* Mobile Auth and Cart */}
          </div>
        </div>
      </div>
      {/* Overlay */}
      {openTop && <div className="fixed inset-0 bg-black/30 z-[999]" onClick={() => setOpenTop(false)} />}
    </nav>
  );
};

export default NavBar;