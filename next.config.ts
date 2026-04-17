import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'https://api-yeoh.onrender.com';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'epocacosmeticos.vteximg.com.br' },
      { protocol: 'https', hostname: 'a-static.mlcdn.com.br' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'belezanaweb.vteximg.com.br' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/price-data',
        destination: `${API_URL}/api/products/`,
      },
      {
        source: '/api/url-data',
        destination: `${API_URL}/api/urls/`,
      },
      {
        source: '/api/urls/update_is_active',
        destination: `${API_URL}/api/urls/update_is_active/`,
      },
    ];
  },
};

export default nextConfig;
