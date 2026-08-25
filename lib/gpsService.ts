/**
 * GPS Service for technician location tracking
 * Enables check-in/check-out at customer locations
 */

export interface LocationData {
    lat: number
    lng: number
    accuracy: number
    timestamp: number
    address?: string
}

export interface CheckInRecord {
    orderId: string
    technicianId: string
    type: "check_in" | "check_out"
    location: LocationData
    timestamp: Date
}

/**
 * Get current GPS location
 */
export function getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported"))
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords

                // Optionally reverse geocode
                let address: string | undefined
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await response.json()
                    address = data.display_name
                } catch (e) {
                    // Ignore geocoding errors
                }

                resolve({
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    timestamp: position.timestamp,
                    address
                })
            },
            (error) => {
                reject(new Error(error.message))
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    })
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
}

/**
 * Check if technician is within range of customer location (in km)
 */
export function isWithinRange(
    techLat: number,
    techLng: number,
    customerLat: number,
    customerLng: number,
    maxDistanceKm: number = 0.5
): boolean {
    const distance = calculateDistance(techLat, techLng, customerLat, customerLng)
    return distance <= maxDistanceKm
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
    if (location.address) {
        return location.address
    }
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
}

/**
 * Watch position for real-time tracking
 */
export function watchLocation(
    onUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
): number | null {
    if (!navigator.geolocation) {
        onError?.(new Error("Geolocation is not supported"))
        return null
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            onUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            })
        },
        (error) => {
            onError?.(new Error(error.message))
        },
        { enableHighAccuracy: true }
    )
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
    navigator.geolocation.clearWatch(watchId)
}
