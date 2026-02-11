import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://vaas-greenbelt.vercel.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://vaas-greenbelt.vercel.app/build', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://vaas-greenbelt.vercel.app/ideas', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://vaas-greenbelt.vercel.app/trends', lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: 'https://vaas-greenbelt.vercel.app/generate', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];
}
