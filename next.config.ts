// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSy...yourKey",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your-app.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your-app",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:123...abcdef",
  },
};

module.exports = nextConfig;
