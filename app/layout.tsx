import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";


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
        className={`${raleway.className} antialiased overflow-x-hidden `}
      >
        <Toaster position="top-right" reverseOrder={false} toastOptions={{
         success: {
          style: {
            background: "#3B7A57", // deep green
            color: "#F5F5DC",     // beige text
          },
        },
        error: {
          style: {
            background: "#BB4848", // muted red (your redTransparent button color)
            color: "#FFFFFF",      // white text
          }}
        }}/>
        {children}
      </body>
    </html>
  );
}
