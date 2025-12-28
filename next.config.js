/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbo: false
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false
      };
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};
module.exports = nextConfig;