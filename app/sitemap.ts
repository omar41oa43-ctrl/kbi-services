import { MetadataRoute } from 'next'
import { locations } from '@/lib/locations'
import { SERVICES_SEO_DATA } from '@/lib/services-seo-data'

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
    const localizedStaticPaths = new Set(['/book', '/corporate', '/about', '/contact', '/track'])

    const staticRoutes = routes.map((r) => ({
        url: `${baseUrl}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        ...(r.path === '' ? {
            alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar`, 'x-default': baseUrl } },
        } : r.path === '/services' ? {
            alternates: { languages: { en: `${baseUrl}/services`, ar: `${baseUrl}/ar/services`, 'x-default': `${baseUrl}/services` } },
        } : localizedStaticPaths.has(r.path) ? {
            alternates: { languages: { en: `${baseUrl}${r.path}`, ar: `${baseUrl}/ar${r.path}`, 'x-default': `${baseUrl}${r.path}` } },
        } : {}),
    }))

    const locationRoutes = locations.map((loc) => ({
        url: `${baseUrl}/locations/${loc.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
            languages: {
                en: `${baseUrl}/locations/${loc.slug}`,
                ar: `${baseUrl}/ar/locations/${loc.slug}`,
                'x-default': `${baseUrl}/locations/${loc.slug}`,
            },
        },
    }))

    const serviceRoutes = SERVICES_SEO_DATA.map((service) => ({
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        alternates: {
            languages: {
                en: `${baseUrl}/services/${service.slug}`,
                ar: `${baseUrl}/ar/services/${service.slug}`,
                'x-default': `${baseUrl}/services/${service.slug}`,
            },
        },
    }))

    const arabicRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/ar`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1,
            alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar`, 'x-default': baseUrl } },
        },
        {
            url: `${baseUrl}/ar/services`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
            alternates: { languages: { en: `${baseUrl}/services`, ar: `${baseUrl}/ar/services`, 'x-default': `${baseUrl}/services` } },
        },
        ...['/book', '/corporate', '/about', '/contact', '/track'].map((path) => ({
            url: `${baseUrl}/ar${path}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: path === '/book' ? 0.9 : 0.8,
            alternates: {
                languages: {
                    en: `${baseUrl}${path}`,
                    ar: `${baseUrl}/ar${path}`,
                    'x-default': `${baseUrl}${path}`,
                },
            },
        })),
        ...SERVICES_SEO_DATA.map((service) => ({
            url: `${baseUrl}/ar/services/${service.slug}`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
            alternates: {
                languages: {
                    en: `${baseUrl}/services/${service.slug}`,
                    ar: `${baseUrl}/ar/services/${service.slug}`,
                    'x-default': `${baseUrl}/services/${service.slug}`,
                },
            },
        })),
        ...locations.map((loc) => ({
            url: `${baseUrl}/ar/locations/${loc.slug}`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            alternates: {
                languages: {
                    en: `${baseUrl}/locations/${loc.slug}`,
                    ar: `${baseUrl}/ar/locations/${loc.slug}`,
                    'x-default': `${baseUrl}/locations/${loc.slug}`,
                },
            },
        })),
    ]

    return [...staticRoutes, ...serviceRoutes, ...arabicRoutes, ...locationRoutes]
}
