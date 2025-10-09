"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import SearchBar from "../common-components/search-bar";

// API base for your backend
const API_BASE = "http://localhost:5000";

// Types that match /api/auth/me
type ApiUser = {
  userId: string;
  fName: string;
  lName: string;
  email: string;
  address?: string | null;
  contact?: string | null;
  createdAt: string;
  updatedAt: string;
};

function getToken(): string {
  try {
    const raw = localStorage.getItem("access_token");
    if (!raw) return "";
    const t = raw.trim();
    return t && t !== "null" && t !== "undefined" ? t : "";
  } catch {
    return "";
  }
}

const NavBar = () => {
  const pathname = usePathname();

  const newArrivalItems = ["Men", "Women", "Kids"];
  const otherItems = ["Undergarment", "Casual Wear", "Night Wear"];

  const [openTop, setOpenTop] = useState(false);
  const [openBottom, setOpenBottom] = useState(false);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);

  const [dropdownA, setDropdownA] = useState(false);
  const [dropdownB, setDropdownB] = useState(false);
  const [dropdownC, setDropdownC] = useState(false);
  const [dropdownD, setDropdownD] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Account modal state (kept)
  const [accountOpen, setAccountOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset bottom scroller when opened
  useEffect(() => {
    if (openBottom && bottomScrollRef.current) {
      try {
        bottomScrollRef.current.scrollTo({ left: 0, behavior: "auto" });
      } catch {
        bottomScrollRef.current.scrollLeft = 0;
      }
    }
  }, [openBottom]);

  // --- KEY PART: (Re)load user whenever:
  //  - the component mounts
  //  - the route changes (e.g., after navigating away from /Login)
  //  - a custom "auth:updated" event is dispatched (immediately after login)
  useEffect(() => {
    let alive = true;

    const loadMe = async () => {
      const token = getToken();
      if (!token) {
        if (alive) setCurrentUser(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (alive) setCurrentUser(null);
          return;
        }
        const data: { user: ApiUser } = await res.json();
        if (alive) setCurrentUser(data.user);
      } catch {
        if (alive) setCurrentUser(null);
      }
    };

    loadMe();

    const onAuthUpdated = () => loadMe(); // call this after login sets the token
    window.addEventListener("auth:updated", onAuthUpdated as EventListener);

    return () => {
      alive = false;
      window.removeEventListener("auth:updated", onAuthUpdated as EventListener);
    };
  }, [pathname]);

  const displayFirstName =
    currentUser?.fName || (currentUser?.email ? currentUser.email.split("@")[0] : undefined);



  const openAccountManager = () => {
    if (!currentUser) return;
    setFName(currentUser.fName || "");
    setLName(currentUser.lName || "");
    setContact(currentUser.contact || "");
    setAddress(currentUser.address || "");
    setAccountOpen(true);
    setUserMenuOpen(false);
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!currentUser || !token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fName: fName.trim(),
          lName: lName.trim(),
          contact: contact.trim(),
          address: address.trim(),
        }),
      });

      if (!res.ok) {
        setSaving(false);
        return;
      }

      const data: { user: ApiUser } = await res.json();
      setCurrentUser(data.user);
      setAccountOpen(false);
    } finally {
      setSaving(false);
    }
  };
  //Sign Out
  const handleSignOut = () => {
    try {
      localStorage.removeItem("access_token");
      window.location.assign("/")
    } catch {}
    setCurrentUser(null);
    setUserMenuOpen(false);
    // no router.refresh or extra listeners needed
  };

  return (
    <nav className="flex justify-center items-center w-screen flex-wrap gap-2 overflow-visible top-navbar">
      {/* Top Navbar */}
      <div className="flex items-center max-md:justify-around justify-between min-w-screen 
                  border-b-2 px-10 h-[110px] max-md:h-[130px] max-md:p-5">
        <div className="flex items-center gap-20 max-[500px]:gap-50 w-fit h-fit
                   max-w-screen-lg mx-4 max-md:mx-0 max-lg:w-[300px] max-xl:gap-10">
          <Link href="/" className="shrink-0">
            <Image
              src="/assets/icons/logo.jpg"
              alt="Logo"
              width={60}
              height={60}
              className="min-w-[48px] min-h-[48px] w-[60px] h-[60px]"
            />
          </Link>
          <SearchBar size="md" />
        </div>

        <div
          className={`flex items-start justify-center gap-20 md:relative md:min-h-auto
            md:transition-none max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:min-w-60
            max-md:bg-beige max-[350px]:w-[300px] max-[350px]:overflow-x-scroll max-[350px]:no-scrollbar
            max-md:transition-transform max-md:duration-500 max-md:ease-in-out ${
              openTop
                ? "max-md:translate-x-0 max-md:opacity-100 z-[1000] max-md:text-md max-sm:text-sm"
                : "max-md:translate-x-full max-md:opacity-0"
            }`}
        >
          <div className="flex md:flex-row flex-col max-md:items-center items-center md:gap-[4vw] gap-8 max-md:mt-9">
            <button
              className="block md:hidden ml-4 cursor-pointer"
              onClick={() => setOpenTop(!openTop)}
            >
              <X size={32} />
            </button>
            <div className="flex relative flex-shrink-1 w-fit h-fit gap-10 items-center
                       max-md:flex-col justify-center max-xl:gap-5">
              {[
                { Label: "Bulk Order", href: "/BulkOrder" },
                { Label: "Contact Us", href: "/contact" },
                { Label: "About Us", href: "/AboutUs" },
              ].map((item) => (
                <p
                  key={item.href}
                  className="text-dark-green font-medium text-sm sm:text-sm 
                            hover:font-bold transition-all max-md:font-bold lg:text-sm xl:text-base max-xl:truncate"
                >
                  <Link href={item.href}>{item.Label}&nbsp;</Link>
                </p>
              ))}
            </div>

            {/* Cart */}
            <div className="flex relative flex-shrink-0 w-fit h-fit cursor-pointer gap-5">
              <Link href="/cart">
              <p
                className={` text-dark-green font-bold text-sm sm:text-sm md:text-xs lg:text-sm xl:text-base 
                  ${openTop ? "flex" : "hidden"}`}
              >
                Cart page
              </p>
              <Image
                src="/assets/icons/Shopping_cart.svg"
                alt="Cart-Icon"
                width={32}
                height={25}
                className="max-md:w-6"
              />
              <span className="absolute -top-3 right-3.5 w-5 h-5 flex items-center justify-center rounded-full bg-light-green text-white text-sm font-bold max-md:text-xs max-md:w-4 max-md:h-4">
                0
              </span>
              </Link>
            </div>

            {/* Auth section */}
            {currentUser ? (
              <div className="relative mr-3">
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2f432a] px-3 py-1.5 text-[#eadfcd] text-sm font-semibold hover:opacity-90"
              >
                <span className="inline-grid place-items-center h-7 w-7 rounded-full bg-[#F3C86A] text-[#2f432a] font-bold">
                  {(currentUser.fName || currentUser.email)[0].toUpperCase()}
                </span>
                <span className="hidden sm:block">
                  {`${displayFirstName || ""}`.trim().toUpperCase()}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border z-[1000] border-black/5 bg-white shadow-lg p-1 text-sm">
                  <Link
                    href="/orders"
                    className="block rounded-lg px-3 py-2 hover:bg-neutral-50"
                  >
                    Order history
                  </Link>
                  <Link
                    href="/track"
                    className="block rounded-lg px-3 py-2 hover:bg-neutral-50"
                  >
                    Track orders
                  </Link>
                  <button
                    onClick={openAccountManager}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-neutral-50"
                  >
                    Account management
                  </button>
                  <div className="my-1 border-t border-neutral-200" />
                  <button
                    onClick={() => {
                      handleSignOut();
                      // no event needed to leave things simple
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
              
            ) :  (
              <Link href="/Login">
                <div className="flex items-center cursor-pointer gap-3 mr-3">
                  <p className="text-dark-green font-bold underline text-sm sm:text-sm md:text-xs lg:text-sm xl:text-base">
                    Login / Sign Up
                  </p>
                  <Image
                    src="/assets/icons/account_circle.svg"
                    alt="Account-Icon"
                    width={32}
                    height={32}
                  />
                </div>
              </Link>
            ) }
          </div>
        </div>

        <button
          className="block md:hidden ml-4 cursor-pointer"
          onClick={() => setOpenTop(!openTop)}
        >
          <Menu size={32} />
        </button>
      </div>

      {/* Bottom Navbar */}
      <div className="flex items-center relative justify-start w-screen gap-4 sm:gap-6 md:gap-10 px-4 sm:px-6 md:px-10 text-l ">
        {!openBottom && (
          <button
            aria-label="Open menu"
            className="relative z-30 block md:hidden ml-4 md:h-10 h-8 sm:h-9 cursor-pointer"
            onClick={() => setOpenBottom(!openBottom)}
          >
            <Menu className="w-5 h-5 min-[800px]:w-6 min-[800px]:h-6 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          </button>
        )}

        <div
          ref={bottomScrollRef}
          className={`flex items-start shrink justify-start gap-3 sm:gap-5 md:gap-10
            max-[550px]:gap-2 flex-nowrap md:relative max-md:h-fit md:transition-none
            max-md:absolute max-md:inset-x-0 max-md:left-0 max-md:top-0 max-md:w-full 
            max-md:min-w-0 min-h-8 sm:min-h-9 md:min-h-10 z-50 max-[800px]:overflow-x-visible
            min-[420px]:overflow-x-visible max-md:overflow-y-hidden overscroll-x-contain
            no-scrollbar touch-pan-x scroll-smooth max-md:transition-transform max-md:duration-500
            max-md:ease-in-out ${
              openBottom
                ? "max-md:translate-x-0 max-md:opacity-100 "
                : "max-md:-translate-x-full max-md:opacity-0"
            }`}
        >
          {openBottom && (
            <button
              aria-label="Close menu"
              className="inline-flex md:hidden items-center justify-center h-8 sm:h-9 md:h-10 cursor-pointer flex-none px-7 z-30"
              onClick={() => setOpenBottom(!openBottom)}
            >
              <X className="w-6 h-6 min-[800px]:w-7 min-[800px]:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
            </button>
          )}

          {/* New Arrivals */}
          <div className="flex flex-col pr-10 items-center relative shrink min-w-0 w-36 max-md:min-w-[9.5rem] md:w-auto min-[800px]:flex-1 min-[800px]:basis-0 min-[800px]:min-w-0 gap-1 sm:gap-2">
            <div
              className="flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10"
              onClick={() => {
                setDropdownA((v) => !v);
                setDropdownB(false);
                setDropdownC(false);
                setDropdownD(false);
              }}
            >
              <p className="text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none">
                New Arrivals
              </p>
              <Image
                src={
                  dropdownA
                    ? "/assets/icons/arrow_up.svg"
                    : "/assets/icons/arrow_down.svg"
                }
                alt="Arrow Icon"
                width={16}
                height={16}
                className="transition-all duration-300 ease-in-out"
              />
            </div>
            <ul
              className={`bg-[#e0deda] cursor-pointer w-full md:w-max md:min-w-[12rem]
                md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md
                origin-top flex flex-col items-center transition-[max-height,opacity,transform]
                duration-300 ease-out ${
                  dropdownA
                    ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto"
                    : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
                }`}
            >
              {newArrivalItems.map((item) => (
                <li
                  key={item}
                  className={`text-[11px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${
                    item == "Men" ? "rounded-t-lg" : ""
                  } ${item == "Kids" ? "rounded-b-lg" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Men */}
          <div className="flex flex-col pr-10 items-center relative shrink-0 w-36 md:w-40 max-[800px]:min-w-[9.5rem] min-[800px]:w-auto min-[800px]:flex-1 min-[800px]:basis-0 min-[800px]:min-w-0 min-[800px]:shrink gap-1 sm:gap-2 ">
            <div
              className="flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10"
              onClick={() => {
                setDropdownA(false);
                setDropdownB((v) => !v);
                setDropdownC(false);
                setDropdownD(false);
              }}
            >
              <p className="text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none">
                Men
              </p>
              <Image
                src={
                  dropdownB
                    ? "/assets/icons/arrow_up.svg"
                    : "/assets/icons/arrow_down.svg"
                }
                alt="Arrow Icon"
                width={16}
                height={16}
                className="transition-all duration-300 ease-in-out"
              />
            </div>
            <ul
              className={`bg-[#e0deda] cursor-pointer w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                dropdownB
                  ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto"
                  : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
            >
              {otherItems.map((item) => (
                <li
                  key={item}
                  className={`text-[11px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${
                    item == "Undergarment" ? "rounded-t-lg" : ""
                  } ${item == "Night Wear" ? "rounded-b-lg" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Women */}
          <div className="flex flex-col pr-10 items-center relative shrink-0 w-36 md:w-40 max-[800px]:min-w-[9.5rem] min-[800px]:w-auto min-[800px]:flex-1 min-[800px]:basis-0 min-[800px]:min-w-0 min-[800px]:shrink gap-1 sm:gap-2">
            <div
              className="flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10"
              onClick={() => {
                setDropdownA(false);
                setDropdownB(false);
                setDropdownC((v) => !v);
                setDropdownD(false);
              }}
            >
              <p className="text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none">
                Women
              </p>
              <Image
                src={
                  dropdownC
                    ? "/assets/icons/arrow_up.svg"
                    : "/assets/icons/arrow_down.svg"
                }
                alt="Arrow Icon"
                width={16}
                height={16}
                className="transition-all duration-300 ease-in-out"
              />
            </div>
            <ul
              className={`bg-[#e0deda] cursor-pointer w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                dropdownC
                  ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto"
                  : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
            >
              {otherItems.map((item) => (
                <li
                  key={item}
                  className={`text-[11px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${
                    item == "Undergarment" ? "rounded-t-lg" : ""
                  } ${item == "Night Wear" ? "rounded-b-lg" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Kids */}
          <div className="flex flex-col pr-10 items-center relative shrink-0 w-36 md:w-40 max-[800px]:min-w-[9.5rem] min-[800px]:w-auto min-[800px]:flex-1 min-[800px]:basis-0 min-[800px]:min-w-0 min-[800px]:shrink gap-1 sm:gap-2">
            <div
              className="flex gap-2 cursor-pointer select-none items-center h-8 sm:h-9 md:h-10"
              onClick={() => {
                setDropdownA(false);
                setDropdownB(false);
                setDropdownC(false);
                setDropdownD((v) => !v);
              }}
            >
              <p className="text-md max-[550px]:text-sm max-[420px]:text-xs font-semibold leading-none">
                Kids
              </p>
              <Image
                src={
                  dropdownD
                    ? "/assets/icons/arrow_up.svg"
                    : "/assets/icons/arrow_down.svg"
                }
                alt="Arrow Icon"
                width={16}
                height={16}
                className="transition-all duration-300 ease-in-out"
              />
            </div>
            <ul
              className={`bg-[#e0deda] cursor-pointer w-full md:w-max md:min-w-[12rem] md:absolute md:top-full md:left-0 md:z-[70] mt-1 rounded-lg shadow-md origin-top flex flex-col items-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                dropdownD
                  ? "max-h-[240px] opacity-100 scale-y-100 pointer-events-auto"
                  : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
              }`}
            >
              {otherItems.map((item) => (
                <li
                  key={item}
                  className={`text-[11px] sm:text-sm md:text-md text-center whitespace-nowrap w-full flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 hover:bg-dark-green hover:text-beige ${
                    item == "Undergarment" ? "rounded-t-lg" : ""
                  } ${item == "Night Wear" ? "rounded-b-lg" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Account Manager Modal */}
      {accountOpen && currentUser && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={handleAccountSave}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-[#2f432a] mb-4">
              Account Management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  First name
                </label>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Last name
                </label>
                <input
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Contact
                </label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="rounded-xl border border-neutral-300 bg-white py-2 font-medium hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#2f432a] text-[#eadfcd] py-2 font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="mt-4 border-t border-neutral-200 pt-4">
              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="w-full rounded-xl border border-red-300 text-red-600 py-2 font-semibold hover:bg-red-50"
              >
                Delete account
              </button>
            </div>
          </form>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
