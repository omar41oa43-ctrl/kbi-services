
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/tech/', '/corporate/portal', '/api/', '/rate/'],
        },
        sitemap: 'https://kbi.services/sitemap.xml',
    }
}
