'use client';

import React, { useState } from "react";
import { Home, Package, ShoppingCart, Users, LogOut, Search } from "lucide-react";

const DashboardLayout = () => {
  const [activePage, setActivePage] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: <Home className="h-5 w-5" />, path: "" }, // 👉 add path
    { name: "Inventory", icon: <Package className="h-5 w-5" />, path: "" },
    { name: "Orders", icon: <ShoppingCart className="h-5 w-5" />, path: "" },
    { name: "Users", icon: <Users className="h-5 w-5" />, path: "/AdminPanelUser" },
  ];

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="h-full w-64 bg-[#e6d0a7] flex flex-col justify-between p-4">
        {/* User Info */}
        <div>
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/profile.jpg"
              alt="ProfilePic"
              className="h-20 w-20 rounded-full object-cover mb-2"
            />
            <h2 className="text-lg font-semibold">Sathees Malavan</h2>
            <p className="text-sm text-gray-700">satheesmalavan100@gmail.com</p>
          </div>

          {/* Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.path} // 👉 you can insert your path here
                className={`flex items-center space-x-2 px-3 py-2 w-full rounded-md transition ${
                  activePage === item.name
                    ? "bg-[#f4e7cd] font-medium"
                    : "hover:bg-[#f4e7cd]"
                }`}
                onClick={() => setActivePage(item.name)}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div>
          <button className="flex items-center space-x-2 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition">
            <LogOut className="h-5 w-5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Top Bar */}
      <div
        className="h-16 bg-white shadow flex items-center px-6 justify-between fixed top-0 right-0 z-50"
        style={{ width: "calc(100% - 16rem)", marginLeft: "16rem" }}
      >
        <h1 className="text-xl font-semibold">{activePage}</h1>

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

export default DashboardLayout;
