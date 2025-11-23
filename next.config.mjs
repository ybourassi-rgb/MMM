// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Dealabs & Pepper family
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "**.dealabs.com" },
      { protocol: "https", hostname: "**.pepper.com" },

      // Amazon
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.amazon.fr" },
      { protocol: "https", hostname: "**.amazonaws.com" },

      // Ebay / Ali / etc (au cas où)
      { protocol: "https", hostname: "**.ebay.com" },
      { protocol: "https", hostname: "**.ebay.fr" },
      { protocol: "https", hostname: "**.aliexpress.com" },

      // Divers
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },
    ],
  },
};

export default nextConfig;
