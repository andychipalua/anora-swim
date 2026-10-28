/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // small self-contained build for Docker
};

export default nextConfig;
