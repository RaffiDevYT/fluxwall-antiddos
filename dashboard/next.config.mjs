/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/admin",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: "/admin",
  },
};

export default nextConfig;
