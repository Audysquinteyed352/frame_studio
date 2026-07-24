import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pipeline"],
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "remotion",
    "@rspack/binding",
    "@rspack/*",
    "@remotion/google-fonts",
    "@remotion/cli",
    "esbuild"
  ],
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
      // Ensure remotion and rspack native bindings are required at runtime from node_modules
      const serverExternals = [
        "@remotion/bundler",
        "@remotion/renderer",
        "remotion",
        "@remotion/google-fonts",
        "@remotion/cli",
        "@rspack/binding",
        "@rspack/core",
      ];

      for (const ext of serverExternals) {
        if (!config.externals.includes(ext)) {
          config.externals.push(ext);
        }
      }
    }

    return config;
  },
};

export default nextConfig;
