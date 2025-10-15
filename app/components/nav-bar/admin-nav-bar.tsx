'use client';

import React from "react";
import Link from "next/link";
import { Home, Package, ShoppingCart, Users, LogOut, Search } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const AdminNavBar = () => {
  const menuItems = [
    { name: "Dashboard", icon: <Home className="h-5 w-5" />, path: "/Dashboard" },
    { name: "Inventory", icon: <Package className="h-5 w-5" />, path: "/Inventory" },
    { name: "Orders", icon: <ShoppingCart className="h-5 w-5" />, path: "/orders" },
    { name: "Users", icon: <Users className="h-5 w-5" />, path: "/users" },
  ];

  const pathname = usePathname();

  // Extract last part of the path (e.g. /Dashboard → Dashboard)
  const currentPage =
    pathname === "/"
      ? "Dashboard"
      : pathname.replace("/", "").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="w-64 lg:min-h-screen">
      {/* Sidebar */}
      <div className="h-full w-64 bg-[#e6d0a7] flex flex-col justify-between p-4 fixed left-0 top-0 bottom-0 z-50">
        {/* User Info */}
        <div>
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/assets/images/profile.jpg"
              alt="ProfilePic"
              className="h-20 w-20 rounded-full object-cover mb-2"
              width={40}
              height={40}
            />
            <h2 className="text-lg font-semibold">Sathees Malavan</h2>
            <p className="text-sm text-gray-700">satheesmalavan100@gmail.com</p>
          </div>

          {/* Menu */}
          <nav className="flex flex-col justify-around h-full">
            {menuItems.map((item, index) => (
              <Link key={`${item.name}-${index}`} href={item.path}>
                <div
                  className={`flex items-center space-x-2 px-3 py-2 w-full rounded-md transition hover:bg-[#f4e7cd]`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div>
          <button 
            onClick={() => {
              localStorage.removeItem("access_token");
              window.location.href = "/Login"; // or use router.push("/login")
            }}
            className="flex items-center space-x-2 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Top Bar */}
      <div
                className="h-16 bg-white shadow flex items-center px-6 justify-between fixed top-0 z-40"
                // Change style to use 'left' instead of 'marginLeft' and calculated 'width'
                style={{ left: "16rem", right: 0 }} 
      >
        <h1 className="text-xl font-semibold">{currentPage}</h1>

        <div className="flex items-center w-full max-w-xs bg-gray-100 rounded-lg px-3 py-2">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-full bg-transparent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminNavBar;