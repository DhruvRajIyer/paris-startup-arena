/**
 * Geocoding utilities using Nominatim (OpenStreetMap)
 * Free, no API key required, rate limit: 1 req/second
 */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Rate limit: 1 req/second (Nominatim policy)
  await sleep(1100);

  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'fr',
    viewbox: '2.2241,48.8156,2.4699,48.9021', // Paris bounding box
    bounded: '1',
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 
        'User-Agent': 'paris-startup-arena/1.0 (contact@example.com)' 
      }
    });

    const data = await res.json();
    if (!data.length) return null;

    return { 
      lat: parseFloat(data[0].lat), 
      lng: parseFloat(data[0].lon) 
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function getArrondissement(lat: number, lng: number): Promise<number | null> {
  await sleep(1100);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 
          'User-Agent': 'paris-startup-arena/1.0 (contact@example.com)' 
        }
      }
    );

    const data = await res.json();
    const postcode = data.address?.postcode;
    
    if (postcode?.startsWith('750')) {
      return parseInt(postcode.slice(3)); // '75009' → 9
    }
    
    return null;
  } catch (error) {
    console.error('Arrondissement lookup error:', error);
    return null;
  }
}
