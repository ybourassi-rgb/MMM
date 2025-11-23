// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "images**.dealabs.com" },
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.amazon.fr" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },
      // ajoute au fur et à mesure les domaines vus dans tes feeds
    ],
  },
};

module.exports = nextConfig;
