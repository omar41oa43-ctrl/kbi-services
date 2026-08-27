
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/book', '/track', '/rate/', '/jobs/', '/corporate/portal'],
        },
        sitemap: 'https://kbi.services/sitemap.xml',
    }
}
