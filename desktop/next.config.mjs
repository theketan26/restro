/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  ...(isProd ? { output: "export" } : {}),
  images: { unoptimized: true },
  trailingSlash: isProd,
};

export default nextConfig;
