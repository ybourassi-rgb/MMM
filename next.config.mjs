// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Dealabs / HotUKDeals CDNs
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "images.dealabs.com" },
      { protocol: "https", hostname: "images-hotukdeals.akamaized.net" },
      { protocol: "https", hostname: "static-pepper.dealabs.com" },

      // Amazon / Ali / Ebay / etc.
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },
      { protocol: "https", hostname: "ae01.alicdn.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
    ],
  },
};

export default nextConfig;
