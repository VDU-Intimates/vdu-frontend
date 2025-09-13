// app/dashboard/page.tsx  (Next.js 13+ with App Router)
import React from "react";
import { Search, Package, Box, AlertTriangle, ClipboardList, Users } from "lucide-react";
import Image from "next/image";

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-[#f7f5ef]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#d8c39d] p-6 flex flex-col items-center">
        <Image
          src="/assets/images/team.png"
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover mb-4"
          width={112} height={112}
        />
        <h2 className="font-semibold text-lg">Sathees Malavan</h2>
        <p className="text-sm text-gray-700">satheesmalavan100@gmail.com</p>

        <nav className="mt-8 w-full">
          <ul className="space-y-4">
            <li className="bg-white rounded-xl px-4 py-2 font-semibold shadow">Dashboard</li>
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl">
              <ClipboardList size={20} /> <span>Inventory</span>
            </li>
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl">
              <Box size={20} /> <span>Orders</span>
            </li>
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl">
              <Users size={20} /> <span>Users</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome Malavan!!!</h1>
          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
            <Search size={18} className="text-gray-600" />
            <input
              type="text"
              placeholder="search"
              className="bg-transparent outline-none text-sm"
            />
          </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center">
            <Package size={28} className="mr-2" /> Total Product
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center">
            <ClipboardList size={28} className="mr-2" /> Order
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center">
            <Box size={28} className="mr-2" /> Total Stock
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center">
            <AlertTriangle size={28} className="mr-2 text-red-500" /> Out of Stock
          </div>
        </div>

        {/* Overview Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Over View</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-600">Daily Average Sales</p>
              <h3 className="text-4xl font-bold mt-2">660</h3>
              <p className="text-sm text-gray-500">Last Check on 21 Apr</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold">Monthly Average Sales</h3>
              <p className="text-2xl font-bold">12.3K</p>
              <div className="mt-4 space-y-2">
                <p>Spending: 2.3K <span className="text-green-600">+11.4%</span></p>
                <p>Allocation: 1.6K <span className="text-green-600">+4.0%</span></p>
                <p>Amount: 1.1K <span className="text-green-600">+7.0%</span></p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

