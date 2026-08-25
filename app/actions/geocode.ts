"use server"

interface NominatimResponse {
    address?: {
        road?: string
        neighbourhood?: string
        suburb?: string
        city?: string
        town?: string
        state?: string
        [key: string]: string | undefined
    }
    display_name?: string
    error?: string
}

export async function reverseGeocode(lat: number, lon: number, lang: "en" | "ar" = "en") {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': lang,
                    'User-Agent': 'KBIRepairService/1.0 (contact@kbi.services)' // Required by Nominatim
                }
            }
        )

        if (!response.ok) {
            return { error: `Failed to fetch address. Status: ${response.status}` };
        }

        const data = await response.json() as NominatimResponse;

        if (data.error) {
            return { error: data.error };
        }

        // Process address into a clean string on the server or return raw data
        let address = ""
        if (data.address) {
            const parts = []
            if (data.address.road) parts.push(data.address.road)
            if (data.address.neighbourhood) parts.push(data.address.neighbourhood)
            if (data.address.suburb) parts.push(data.address.suburb)
            if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town)
            if (data.address.state) parts.push(data.address.state)
            address = parts.join(", ")
        } else {
            address = data.display_name || ""
        }

        return { address };

    } catch (error) {
        return { error: "Failed to detect address" }
    }
}
