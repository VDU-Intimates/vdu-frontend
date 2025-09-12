"use client";
import { useEffect, useState } from "react";
import { Package, ClipboardList, Box, AlertTriangle, Users, Edit, Trash } from "lucide-react";

type Product = {
  _id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  // Fetch products
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  // Delete product
  const deleteProduct = async (id: string) => {
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
    });
    setProducts(products.filter((p) => p._id !== id));
  };

  // Update product
  const updateProduct = async () => {
    if (!selected) return;
    await fetch(`http://localhost:5000/api/products/${selected._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });
    setProducts(products.map((p) => (p._id === selected._id ? selected : p)));
    setSelected(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#d8c39d] p-6 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full bg-gray-300 mb-4" />
        <h2 className="font-semibold text-lg">Sathees Malavan</h2>
        <p className="text-sm text-gray-700">satheesmalaqvan100@gmail.com</p>
        <nav className="mt-8 w-full">
          <ul className="space-y-4">
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl cursor-pointer">
              <ClipboardList size={20} /> <span>Inventory</span>
            </li>
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl cursor-pointer">
              <Box size={20} /> <span>Orders</span>
            </li>
            <li className="flex items-center space-x-2 px-4 py-2 hover:bg-white rounded-xl cursor-pointer">
              <Users size={20} /> <span>Users</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inventory List</h1>
        </header>

        {/* Product Table */}
        <table className="w-full bg-white shadow rounded-xl">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">
                  <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                </td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">Rs. {p.price}</td>
                <td className="p-3 flex gap-2">
                  <button
                    className="text-blue-500"
                    onClick={() => setSelected(p)}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => deleteProduct(p._id!)}
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Update Product Form */}
        {selected && (
          <div className="mt-6 p-6 bg-white rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Update Product</h2>
            <input
              type="text"
              placeholder="Product Name"
              value={selected.name}
              onChange={(e) => setSelected({ ...selected, name: e.target.value })}
              className="border p-2 w-full mb-3 rounded"
            />
            <input
              type="text"
              placeholder="Category"
              value={selected.category}
              onChange={(e) => setSelected({ ...selected, category: e.target.value })}
              className="border p-2 w-full mb-3 rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={selected.price}
              onChange={(e) => setSelected({ ...selected, price: +e.target.value })}
              className="border p-2 w-full mb-3 rounded"
            />
            <input
              type="number"
              placeholder="Stock"
              value={selected.stock}
              onChange={(e) => setSelected({ ...selected, stock: +e.target.value })}
              className="border p-2 w-full mb-3 rounded"
            />
            <button
              onClick={updateProduct}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
