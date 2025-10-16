'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Package, ShoppingCart, Users, LogOut, Search, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Define an interface for the user data we expect from the API
interface UserProfile {
  fName: string;
  lName: string;
  email: string;
  photoURL: string | null;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const AdminNavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State to hold the fetched user profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAuthToken();
      if (!token) {
        // If no token, redirect to login
        window.location.href = "/Login";
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // If token is invalid, log out
          throw new Error('Failed to fetch profile');
        }

        const data: UserProfile = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error(error);
        // Log out on any fetch error (e.g., expired token)
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: <Home className="h-5 w-5" />, path: "/Dashboard" },
    { name: "Inventory", icon: <Package className="h-5 w-5" />, path: "/Inventory" },
    { name: "Orders", icon: <ShoppingCart className="h-5 w-5" />, path: "/orders" },
    { name: "Users", icon: <Users className="h-5 w-5" />, path: "/users" },
  ];

  const pathname = usePathname();
  const currentPage = pathname.replace("/", "").replace(/^\w/, (c) => c.toUpperCase()) || "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/Login";
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // A reusable component for the user profile section to avoid repeating code
  const UserProfileSection = () => {
    if (loading) {
      // Skeleton loader while fetching data
      return (
        <div className="flex flex-col items-center mb-6 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-gray-300 mb-2"></div>
          <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 w-40 bg-gray-300 rounded"></div>
        </div>
      );
    }

    if (!userProfile) {
      return null; // Or a fallback UI if profile fails to load but user is authenticated
    }

    return (
      <div className="flex flex-col items-center mb-6 text-center">
        <Image
          src={userProfile.photoURL || "/assets/images/profile.jpg"} // Fallback image
          alt="ProfilePic"
          className="h-20 w-20 rounded-full object-cover mb-2"
          width={80}
          height={80}
        />
        <h2 className="text-lg font-semibold">{`${userProfile.fName} ${userProfile.lName}`}</h2>
        <p className="text-sm text-gray-700 break-all">{userProfile.email}</p>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-64 lg:min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 bg-[#e6d0a7] flex-col justify-between p-4 fixed left-0 top-0 bottom-0 z-50">
        <div>
          <UserProfileSection />
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <div className="flex items-center space-x-2 px-3 py-2 w-full rounded-md transition hover:bg-[#f4e7cd]">
                  {item.icon}<span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <button onClick={handleLogout} /* ... */ >
            <LogOut className="h-5 w-5" /><span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Bar */}
      {/* ... (No changes needed here) ... */}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#e6d0a7] z-50 transform transition-transform duration-300 ease-in-out ${ isMobileMenuOpen ? "translate-x-0" : "-translate-x-full" }`}>
        <div className="h-full flex flex-col justify-between p-4">
          <div>
            <UserProfileSection />
            <nav className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <Link key={item.name} href={item.path} onClick={closeMobileMenu}>
                  <div className="flex items-center space-x-2 px-3 py-2 w-full rounded-md transition hover:bg-[#f4e7cd]">
                    {item.icon}<span>{item.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <button onClick={handleLogout} /* ... */ >
              <LogOut className="h-5 w-5" /><span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavBar;