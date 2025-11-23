const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.dealabs.com" },
      { protocol: "https", hostname: "*.dealabs.com" },
      { protocol: "https", hostname: "static-hotukdeals.akamaized.net" },

      { protocol: "https", hostname: "*.amazon.com" },
      { protocol: "https", hostname: "*.amazon.fr" },

      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "img.leboncoin.fr" },
    ],
  },
};

export default nextConfig;
