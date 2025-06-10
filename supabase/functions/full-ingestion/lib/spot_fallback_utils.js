// Haversine distance function
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Known working buoys with location
const fallbackBuoys = [
  { id: "46232", lat: 32.578, lng: -117.128 },
  { id: "46254", lat: 32.858, lng: -117.262 },
  { id: "46225", lat: 33.209, lng: -117.461 },
  { id: "46222", lat: 33.623, lng: -118.003 },
  { id: "46223", lat: 33.392, lng: -117.597 }
];

// Known working tide stations
const fallbackTideStations = [
  { id: "9410170", lat: 32.578, lng: -117.128 },
  { id: "9410230", lat: 32.800, lng: -117.259 },
  { id: "9410306", lat: 33.195, lng: -117.379 },
  { id: "9410580", lat: 33.618, lng: -117.929 },
  { id: "9410660", lat: 33.426, lng: -117.621 }
];

export function getNearestWorkingBuoy({ lat, lng, fallbackFrom }) {
  const candidates = fallbackBuoys.filter(b => b.id !== fallbackFrom);
  candidates.sort((a, b) => getDistance(lat, lng, a.lat, a.lng) - getDistance(lat, lng, b.lat, b.lng));
  return candidates[0]?.id || fallbackFrom;
}

export function getNearestWorkingTideStation({ lat, lng, fallbackFrom }) {
  const candidates = fallbackTideStations.filter(s => s.id !== fallbackFrom);
  candidates.sort((a, b) => getDistance(lat, lng, a.lat, a.lng) - getDistance(lat, lng, b.lat, b.lng));
  return candidates[0]?.id || fallbackFrom;
}

// Example usage:
// const fallbackBuoy = getNearestWorkingBuoy({ lat: 33.03, lng: -117.29, fallbackFrom: "46223" });
// const fallbackTide = getNearestWorkingTideStation({ lat: 33.03, lng: -117.29, fallbackFrom: "9410660" });
