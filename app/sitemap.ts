import { MetadataRoute } from 'next'
import { locations } from '@/lib/locations'
import { devices } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://kbi.services' // Updated to active domain

    const routes: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
        { path: '', priority: 1.0, changeFrequency: 'daily' },
        { path: '/services', priority: 0.9, changeFrequency: 'weekly' },
        { path: '/book', priority: 0.9, changeFrequency: 'weekly' },
        { path: '/corporate', priority: 0.8, changeFrequency: 'weekly' },
        { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/track', priority: 0.7, changeFrequency: 'monthly' },
        { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
        { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    ]

    const now = new Date()

    const staticRoutes = routes.map((r) => ({
        url: `${baseUrl}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }))

    const locationRoutes = locations.map((loc) => ({
        url: `${baseUrl}/locations/${loc.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const serviceRoutes = devices.map((device) => ({
        url: `${baseUrl}/services/${device.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    return [...staticRoutes, ...serviceRoutes, ...locationRoutes]
}
