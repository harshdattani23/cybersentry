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
        // If private IP, call ipapi.co without an IP to get geo based on server's public IP
        const isPrivate = isPrivateOrLocalIp(ip_address);
        const apiUrl = isPrivate
            ? 'https://ipapi.co/json/'
            : `https://ipapi.co/${ip_address}/json/`;

        const geoRes = await fetch(apiUrl, {
            signal: AbortSignal.timeout(4000),
        });

        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (!geoData.error) {
                city = geoData.city || 'Unknown';
                state = geoData.region || 'Unknown';
                country = geoData.country_name || 'Unknown';
            }
        }
    } catch (err) {
        console.error('Geo API fetch error (non-fatal, will store with Unknown):', err);
    }

    return { country, state, city };
}
