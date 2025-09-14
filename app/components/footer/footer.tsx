import React from "react";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

type TextDetail = { name: string; link: string };
type IconDetail = { icon: React.ReactNode; link: string; label: string };

type Section =
  | { title: string; details: TextDetail[] }
  | { title: string; details: IconDetail[] };

const Footer = () => {
  const footerHeads: Section[] = [
    {
      title: "Company & Policies",
      details: [
        { name: "About Us", link: "/cart" },
        { name: "Contact Us", link: "/contact" },
        { name: "Privacy Policy", link: "/privacy" },
        { name: "Terms & Services", link: "/terms" },
      ],
    },
    {
      title: "Support",
      details: [
        { name: "General Hotline: +94 11 3246 758", link: "/support" },
        { name: "Order Updates", link: "/support/orders" },
        {
          name: "Email: vdu.intimates@email.com",
          link: "mailto:vdu.intimates@email.com",
        },
        { name: "Order Email", link: "/support/order-email" },
      ],
    },
    {
      title: "Follow Us",
      details: [
        {
          icon: <FaFacebook />,
          link: "https://facebook.com",
          label: "Facebook",
        },
        {
          icon: <FaInstagram />,
          link: "https://instagram.com",
          label: "Instagram",
        },
        {
          icon: <FaYoutube />,
          link: "https://youtube.com",
          label: "YouTube",
        },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 py-10 w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {footerHeads.map((section, index) => (
            <div
              key={index}
              className="flex flex-col items-center md:items-start text-center md:text-left"
            >
              <h3 className="text-white text-lg font-semibold mb-4">
                {section.title}
              </h3>

              {"name" in section.details[0] ? (
                // Text Links
                <ul className="space-y-2">
                  {(section.details as TextDetail[]).map((detail, detailIndex) => (
                    <li key={detailIndex}>
                      {detail.link.startsWith("http") ||
                      detail.link.startsWith("mailto:") ? (
                        <a
                          href={detail.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors duration-300"
                        >
                          {detail.name}
                        </a>
                      ) : (
                        <Link
                          href={detail.link}
                          className="hover:text-white transition-colors duration-300"
                        >
                          {detail.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                // Social Icons
                <div className="flex space-x-4 text-white text-2xl">
                  {(section.details as IconDetail[]).map((detail, detailIndex) => (
                    <a
                      key={detailIndex}
                      href={detail.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={detail.label}
                      className="hover:text-white transition-colors duration-300"
                    >
                      {detail.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} VDU Intimates. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
