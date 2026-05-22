import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/nutritionist-consultation',
        destination: '/expert-nutritionist-consultation',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'thebeetamin.com' }],
        destination: 'https://www.thebeetamin.com/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            // Cloudflare Turnstile (Clerk bot protection) probes WebXR in some builds; blocking causes challenge failures.
            value: [
              "accelerometer=*",
              "gyroscope=*",
              "xr-spatial-tracking=*",
              "fullscreen=(self \"https://challenges.cloudflare.com\" \"https://*.cloudflare.com\")",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
