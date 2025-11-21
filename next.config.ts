/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      }
    ],
  },
  async rewrites() {
      return[
        {
          source:"/api/:path*",
          destination:"http://localhost:8000/api/:path*"
        }
      ]
  },
};

export default nextConfig;
