/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true
    },
  images: {
    domains: [
      's1.ticketm.net',
      's2.ticketm.net',
      's3.ticketm.net',
      'images.unsplash.com',
      'eventbrite.com'
    ],
  },
};

export default nextConfig;