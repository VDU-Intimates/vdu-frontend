import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import NavBarAdmin from "./Navbar/navbaradmin"; // ✅ Import existing NavBar

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
    </div>
  );
};

export default UserManagement;
