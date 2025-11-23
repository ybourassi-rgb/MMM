// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Dealabs + CDN
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "**.dealabs.com" },

      // Amazon images (souvent .media-amazon / images-eu)
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.amazon.fr" },
      { protocol: "https", hostname: "**.media-amazon.com" },

      // autres classiques
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },
    ],
  },
};

export default nextConfig;
