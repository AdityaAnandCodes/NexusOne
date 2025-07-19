/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID,
  },
};

module.exports = nextConfig;
