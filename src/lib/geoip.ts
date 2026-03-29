/**
 * Shared utility for IP geolocation lookups.
 * Handles private/local IPs by falling back to a public IP lookup.
 */

export interface GeoResult {
    country: string;
    state: string;
    city: string;
}

/**
 * Checks if an IP address is private/local (not routable on the public internet).
 * These IPs cannot be resolved by geo-location APIs.
 */
function isPrivateOrLocalIp(ip: string): boolean {
    // Strip IPv6-mapped IPv4 prefix (e.g., ::ffff:192.168.1.1 -> 192.168.1.1)
    const cleanIp = ip.replace(/^::ffff:/i, '');

    // Loopback
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return true;

    // Private IPv4 ranges
    if (cleanIp.startsWith('10.')) return true;
    if (cleanIp.startsWith('192.168.')) return true;

    // 172.16.0.0 - 172.31.255.255
    if (cleanIp.startsWith('172.')) {
        const secondOctet = parseInt(cleanIp.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }

    // Link-local
    if (cleanIp.startsWith('169.254.')) return true;

    // IPv6 link-local
    if (ip.toLowerCase().startsWith('fe80:')) return true;

    return false;
}

/**
 * Fetches geo-location data for the given IP address.
 * If the IP is private/local, it falls back to detecting the server's public IP.
 */
export async function getGeoFromIp(ip_address: string): Promise<GeoResult> {
    let country = 'Unknown';
    let state = 'Unknown';
    let city = 'Unknown';

    if (ip_address === 'Unknown') {
        return { country, state, city };
    }

    try {
        const isPrivate = isPrivateOrLocalIp(ip_address);
        
        let fetchSuccess = false;

        // 1. Try ip-api.com (Allows 45 requests per min, HTTP only)
        const primaryUrl = isPrivate 
            ? 'http://ip-api.com/json/' 
            : `http://ip-api.com/json/${ip_address}`;
            
        try {
            const res = await fetch(primaryUrl, { signal: AbortSignal.timeout(4000) });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success') {
                    country = data.country || 'Unknown';
                    state = data.regionName || 'Unknown';
                    city = data.city || 'Unknown';
                    fetchSuccess = true;
                }
            }
        } catch (e) {
            console.error('ip-api.com fetch failed:', e);
        }

        // 2. Fallback to freeipapi.com if primary fails
        if (!fetchSuccess) {
            const fallbackUrl = isPrivate 
                ? 'https://freeipapi.com/api/json/' 
                : `https://freeipapi.com/api/json/${ip_address}`;
                
            try {
                const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(4000) });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.countryName) {
                        country = fallbackData.countryName || 'Unknown';
                        state = fallbackData.regionName || 'Unknown';
                        city = fallbackData.cityName || 'Unknown';
                    }
                }
            } catch (fallbackErr) {
                console.error('freeipapi.com fetch failed:', fallbackErr);
            }
        }

    } catch (err) {
        console.error('Geo API fetch error (non-fatal, will store with Unknown):', err);
    }

    return { country, state, city };
}
