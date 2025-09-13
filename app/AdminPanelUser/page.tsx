'use client';

import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import NavBarAdmin from "../AdminPanel/Navbar/navbaradmin"; // ✅ Import existing NavBar

const UserManagement = () => {
  const [activePage, setActivePage] = useState("Users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState({ show: false, message: "", onConfirm: null });
  const [users, setUsers] = useState([]);

  // Fetch user from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); // Or however you store JWT
        const res = await axios.get("http://localhost:5000/api/auth/get-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const user = res.data.user;
        setUsers([
          {
            id: 1,
            name: `${user.fName} ${user.lName}`,
            email: user.email,
            contact: user.contact || "-",
            address: user.address || "-",
            avatar: "/assets/user3.jpg", // default avatar
          },
        ]);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  const handleDelete = (user) => {
    setModal({
      show: true,
      message: `Are you sure you want to delete "${user.name}"?`,
      onConfirm: () => {
        setUsers(users.filter((u) => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
        setModal({ show: false, message: "", onConfirm: null });
      },
    });
  };

  const handleLogOut = () => {
    setModal({
      show: true,
      message: "Are you sure you want to log out?",
      onConfirm: () => {
        localStorage.removeItem("token"); // remove JWT
        console.log("Logged out!"); // replace with actual navigation
        setModal({ show: false, message: "", onConfirm: null });
      },
    });
  };

  return (
    <div className="flex h-screen font-railway bg-[#F8F4EB]">
      <NavBarAdmin
        activePage={activePage}
        setActivePage={setActivePage}
        onLogOut={handleLogOut}
      />

      <div className="flex-1 flex flex-col p-6 overflow-auto mt-16">
        {activePage === "Users" && (
          <>
            <div className="grid grid-cols-7 gap-4 font-semibold text-gray-700 mb-2">
              <span>User ID</span>
              <span>Profile</span>
              <span>Full Name</span>
              <span>Email Address</span>
              <span>Contact Number</span>
              <span>Address</span>
              <span>Action</span>
            </div>

            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-7 gap-4 items-center p-2 bg-white rounded-lg hover:bg-[#eae3d9] cursor-pointer mb-2"
                onClick={() => setSelectedUser(user)}
              >
                <span>{user.id}</span>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{user.contact}</span>
                <span>{user.address}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {selectedUser && (
              <div className="mt-6 p-4 bg-white rounded-lg w-full max-w-md shadow">
                <h2 className="text-lg font-semibold mb-4">
                  User Info - {selectedUser.name}
                </h2>
                <div className="flex items-center space-x-4 mb-2">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <p>
                  <span className="font-semibold">Email:</span> {selectedUser.email}
                </p>
                <p>
                  <span className="font-semibold">Contact:</span> {selectedUser.contact}
                </p>
                <p>
                  <span className="font-semibold">Address:</span> {selectedUser.address}
                </p>
              </div>
            )}
          </>
        )}

        {activePage !== "Users" && (
          <div>
            <h2 className="text-2xl font-semibold">Welcome to {activePage}</h2>
            <p className="mt-2 text-gray-600">
              Here you can manage your {activePage.toLowerCase()} and more.
            </p>
          </div>
        )}
      </div>

      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <p className="mb-4">{modal.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModal({ show: false, message: "", onConfirm: null })}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={modal.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
