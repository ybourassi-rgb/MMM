// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ===== Dealabs / Pepper network =====
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-pepper.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "*.dealabs.com" },

      // ===== Amazon & gros e-commerce =====
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.amazon.fr" },

      // ===== Images génériques =====
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },

      // ===== Voyages / travel feeds =====
      { protocol: "https", hostname: "www.voyagespirates.fr" },
      { protocol: "https", hostname: "www.travelpirates.com" },
      { protocol: "https", hostname: "www.fly4free.com" },
      { protocol: "https", hostname: "www.secretflying.com" },

      // ===== WordPress / CDN fréquents =====
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**.akamaized.net" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
