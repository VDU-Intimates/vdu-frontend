// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {

    domains: [
      "example.com",     // <-- allow external domain
      "cdn.myshop.com",  // <-- add all other image sources you use
      "localhost",       // <-- if you serve images from backend
    ],

  },
};

module.exports = nextConfig;
