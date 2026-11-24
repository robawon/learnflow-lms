// Next.js configuration.
// bodySizeLimit raises the default 1 MB limit so file uploads (materials, submissions) work up to 10 MB.
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};
export default nextConfig;
