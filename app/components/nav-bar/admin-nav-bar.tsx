'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Package, ShoppingCart, Users, LogOut, Menu, X, Search } from "lucide-react";
import SearchBar from "../common-components/search-bar";

// --- Type Definitions ---
interface UserProfile {
  fName: string;
  lName: string;
  email: string;
  photoURL: string | null;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

// Helper function to get the auth token
const getAuthToken = (): string | null => localStorage.getItem('access_token');

const AdminNavBar = () => {
  // --- State Management ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); // State for mobile search visibility

  // --- Router Hooks ---
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Search Bar Logic ---
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Debounce effect to update the URL after the user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router, searchParams]);

  // --- Data Fetching for User Profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/Login";
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data: UserProfile = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error(error);
        handleLogout();
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Component Logic & Handlers ---
  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: <Home className="h-5 w-5" />, path: "/Dashboard" },
    { name: "Inventory", icon: <Package className="h-5 w-5" />, path: "/Inventory" },
    { name: "Orders", icon: <ShoppingCart className="h-5 w-5" />, path: "/orders" },
    { name: "Users", icon: <Users className="h-5 w-5" />, path: "/users" },
  ];

  const currentPage = pathname.split('/').pop()?.replace(/^\w/, c => c.toUpperCase()) || "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/Login";
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // --- Reusable Sub-Components for a Cleaner Structure ---

  const UserProfileSection = () => {
    if (loadingProfile) {
      return (
        <div className="flex flex-col items-center mb-6 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-gray-300/50 mb-2"></div>
          <div className="h-4 w-32 bg-gray-300/50 rounded mb-2"></div>
          <div className="h-3 w-40 bg-gray-300/50 rounded"></div>
        </div>
      );
    }
    if (!userProfile) return null;

    return (
      <div className="flex flex-col items-center mb-6 text-center">
        <Image
          src={userProfile.photoURL || "/assets/icons/account_circle.svg"}
          alt="Profile Picture"
          className="h-20 w-20 rounded-full object-cover mb-2"
          width={80}
          height={80}
        />
        <h2 className="text-lg font-semibold">{`${userProfile.fName} ${userProfile.lName}`}</h2>
        <p className="text-sm text-gray-700 break-all px-2">{userProfile.email}</p>
      </div>
    );
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="flex flex-col space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <Link 
            key={item.name} 
            href={item.path} 
            onClick={isMobile ? closeMobileMenu : undefined}
          >
            <div className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition hover:bg-[#f4e7cd] ${
              isActive ? 'bg-[#f4e7cd] font-semibold text-black' : 'text-gray-800'
            }`}>
              {item.icon}
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex h-full w-64 bg-[#e6d0a7] flex-col justify-between p-4 fixed left-0 top-0 bottom-0 z-50">
        <div>
          <UserProfileSection />
          <NavLinks />
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 text-red-600 px-3 py-2.5 rounded-md hover:bg-red-100 transition w-full font-semibold"
        >
          <LogOut className="h-5 w-5" />
          <span>LOGOUT</span>
        </button>
      </aside>

      {/* ===== DESKTOP TOP BAR ===== */}
      <header
        className="hidden lg:flex h-16 bg-white shadow-sm items-center px-6 justify-between fixed top-0 z-40"
        style={{ left: "16rem", right: 0 }}
      >
        <h1 className="text-xl font-semibold">{currentPage}</h1>
        
        <SearchBar 
          size="sm"
          value={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </header>

      {/* ===== MOBILE UI ELEMENTS ===== */}
      <div className="lg:hidden">
        {/* Mobile Top Bar */}
        <header className="h-16 bg-white shadow flex items-center px-4 justify-between fixed top-0 left-0 right-0 z-40">
          {isMobileSearchOpen ? (
            // --- SEARCH VIEW ---
            <div className="flex items-center w-full gap-2">
              <SearchBar 
                size="sm" 
                value={searchTerm} 
                onSearchChange={setSearchTerm} 
              />
              <button onClick={() => setIsMobileSearchOpen(false)} className="p-2">
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>
          ) : (
            // --- DEFAULT VIEW ---
            <>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <h1 className="text-xl font-semibold">{currentPage}</h1>
              <button onClick={() => setIsMobileSearchOpen(true)} className="p-2">
                <Search className="h-6 w-6" />
              </button>
            </>
          )}
        </header>

        {/* Overlay for when mobile menu is open */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Sidebar (off-canvas) */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 bg-[#e6d0a7] z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col justify-between p-4 pt-8">
            <div>
              <UserProfileSection />
              <NavLinks isMobile={true} />
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 text-red-600 px-3 py-2.5 rounded-md hover:bg-red-100 transition w-full font-semibold"
            >
              <LogOut className="h-5 w-5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

export default AdminNavBar;