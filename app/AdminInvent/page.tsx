"use client";
import { useState } from "react";

const InventoryPage = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "T-Shirt",
    price: "",
    image: "",
  });

  const [preview, setPreview] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result as string });
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("✅ Product Added!");
      setForm({ name: "", description: "", category: "T-Shirt", price: "", image: "" });
      setPreview("");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#d8c39d] p-6 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full bg-gray-300 mb-4" />
        <h2 className="font-semibold text-lg">Sathees Malavan</h2>
        <p className="text-sm text-gray-700">satheesmalaqvan100@gmail.com</p>
        <nav className="mt-8 w-full space-y-4">
          <div className="px-4 py-2 hover:bg-white rounded-xl cursor-pointer">Dashboard</div>
          <div className="px-4 py-2 bg-white rounded-xl cursor-pointer">Inventory</div>
          <div className="px-4 py-2 hover:bg-white rounded-xl cursor-pointer">Orders</div>
          <div className="px-4 py-2 hover:bg-white rounded-xl cursor-pointer">Users</div>
        </nav>
        <button className="mt-auto text-red-600 font-semibold">Logout</button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory</h1>

        <div className="grid grid-cols-2 gap-8">
          {/* Add Form */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Product</h2>

            <input
              name="name"
              placeholder="Product Name"
              className="w-full border p-2 rounded mb-3"
              value={form.name}
              onChange={handleChange}
            />
            <textarea
              name="description"
              placeholder="Product Description"
              className="w-full border p-2 rounded mb-3"
              value={form.description}
              onChange={handleChange}
            />

            <select
              name="category"
              className="w-full border p-2 rounded mb-3"
              value={form.category}
              onChange={handleChange}
            >
              <option value="T-Shirt">T-Shirt</option>
              <option value="Men's Underwear">Intimate</option>
            </select>

            <input
              type="file"
              accept="image/*"
              className="mb-3"
              onChange={handleImage}
            />

            <input
              name="price"
              placeholder="Price"
              type="number"
              className="w-full border p-2 rounded mb-3"
              value={form.price}
              onChange={handleChange}
            />

            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Add New Product
              </button>
              <button
                onClick={() =>
                  setForm({ name: "", description: "", category: "T-Shirt", price: "", image: "" })
                }
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="font-semibold mb-4">Product Card Preview</h2>
            <div className="border rounded-xl p-4 text-center">
              {preview && (
                <img src={preview} alt="Preview" className="w-40 h-40 object-cover mx-auto mb-3" />
              )}
              <p className="font-bold">Product Name: {form.name}</p>
              <p className="text-gray-600">Description: {form.description}</p>
              <p>Category: {form.category}</p>
              <p className="text-green-700 font-semibold">Price: Rs. {form.price}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryPage;
