/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      };
    }
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    if (!isServer) {
      const ProvidePlugin = config.plugins.find(plugin => plugin.constructor.name === 'ProvidePlugin');
      if (ProvidePlugin) {
        ProvidePlugin.definitions.Buffer = ['buffer', 'Buffer'];
      }
    }
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    unoptimized: true,
  }
};

module.exports = nextConfig;