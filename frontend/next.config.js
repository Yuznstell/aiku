/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Enable React Compiler (React 19 feature)
    experimental: {
        reactCompiler: true,
    },

    // Next.js 16 uses remotePatterns instead of domains
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5029',
                pathname: '/uploads/**',
            },
        ],
    },

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;

