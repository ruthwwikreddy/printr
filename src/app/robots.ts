import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://printr.ruthwikreddy.live';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/app'],
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
