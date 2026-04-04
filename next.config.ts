import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  serverExternalPackages: [
    'youtubei.js',
    'youtube-sr',
    'youtube-search-api',
    'youtube-search-without-api-key',
    'yt-search',
    'ytube-noapi',
    'cheerio',
    'jocles',
    'node-fetch',
    'youtube-po-token-generator'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
