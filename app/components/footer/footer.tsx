import React from 'react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const footerHeads = [
    {
      title: "Company & Policies",
      details: ["About Us", "Contact Us", "Privacy Policy", "Terms & Services"],
    },
    {
      title: "Support",
      details: [
        "General Hotline: +94 11 3246 758",
        "Order Updates",
        "Email: vdu.intimates@email.com",
        "Order Email",
      ],
    },
    {
      title: "Follow Us",
      details: [
        <a
          key="facebook"
          href="#"
          aria-label="Facebook"
          className="hover:text-blue-500 transition-colors duration-300"
        >
          <FaFacebook />
        </a>,
        <a
          key="instagram"
          href="#"
          aria-label="Instagram"
          className="hover:text-pink-500 transition-colors duration-300"
        >
          <FaInstagram />
        </a>,
        <a
          key="youtube"
          href="#"
          aria-label="YouTube"
          className="hover:text-red-500 transition-colors duration-300"
        >
          <FaYoutube />
        </a>,
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

              {/* Strings → vertical list */}
              {typeof section.details[0] === "string" ? (
                <ul className="space-y-2">
                  {section.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>
                      <a
                        href="#"
                        className="hover:text-white transition-colors duration-300"
                      >
                        {detail}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                /* Icons → horizontal row */
                <div className="flex space-x-4 text-white text-2xl">
                  {section.details.map((detail, detailIndex) => (
                    <div key={detailIndex}>{detail}</div>
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
