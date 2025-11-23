// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-pepper.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "*.dealabs.com" },

      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.amazon.fr" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },

      { protocol: "https", hostname: "media.secretflying.com" },
      { protocol: "https", hostname: "www.secretflying.com" },
      { protocol: "https", hostname: "store.steampowered.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },

      // ajoute au fur et à mesure si tu vois un domaine bloqué
    ],
  },
};

export default nextConfig;
