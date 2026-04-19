import type { NextConfig } from "next";
import path from "path";

/**
 * NOTE: @serwist/next uses a webpack plugin which is incompatible with
 * Next.js 16's default Turbopack bundler. PWA/Serwist setup is deferred
 * to Phase 7 (Polish & Deploy) where we'll evaluate @serwist/turbopack.
 * The manifest.json and a basic static service worker handle PWA for now.
 * See LESSONS_LEARNED.md — Lesson 1.
 */

const nextConfig: NextConfig = {
  turbopack: {
    // Explicit root prevents false workspace detection from multiple lockfiles
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "izwxykkategwatlwqwiu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Allow imported recipe images from any HTTPS CDN (Cloudinary, Imgix, etc.)
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
