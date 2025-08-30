import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import NavBar from "./components/nav-bar/nav-bar";

const raleway = Raleway({
  variable: "--font-Raleway",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "VDU Intimates",
  description: "VDU Intimates allows you to design and customize your own dresses with ease, creating personalized styles that reflect your unique taste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${raleway.className} antialiased overflow-hidden`}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
