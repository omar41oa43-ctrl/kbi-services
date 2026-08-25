import { MetadataRoute } from 'next'
import { locations } from '@/lib/locations'
import { devices } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://kbi.services' // Updated to active domain

    const routes = [
        '',
        '/services',
        '/corporate',
        '/book',
        '/track',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
    ]

    const sitemapRoutes = routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    const locationRoutes = locations.map((loc) => ({
        url: `${baseUrl}/locations/${loc.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    const serviceRoutes = devices.map((device) => ({
        url: `${baseUrl}/services/${device.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    return [...sitemapRoutes, ...locationRoutes, ...serviceRoutes]
}
