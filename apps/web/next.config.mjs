/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pipeline"],
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle .md files
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    // Ignore .node binary files
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    });

    // Exclude .d.ts files from processing
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'ignore-loader',
    });

    // Externalize native modules and heavy packages on server
    if (isServer) {
      config.externals = config.externals || [];
    }

    return config;
  },
};

export default nextConfig;
