// Function to check if a point is inside a polygon using ray casting algorithm
export const isPointInPolygon = (point: [number, number], polygonCoords: Array<[number, number]>): boolean => {
  // Ensure we have valid coordinates
  if (!Array.isArray(polygonCoords) || polygonCoords.length < 3) {
    console.warn('Invalid polygon coordinates:', polygonCoords);
    return false;
  }

  const [lat, lng] = point;
  console.log('Checking point:', { lat, lng });
  
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const [xi, yi] = polygonCoords[i];
    const [xj, yj] = polygonCoords[j];
    
    console.log(`Checking edge ${j}->${i}:`, { from: [xj, yj], to: [xi, yi] });

    const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
      console.log('Intersection found at edge');
    }
  }

  return inside;
};

// Function to get current position with timeout
export const getCurrentPosition = (timeout = 10000): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается вашим браузером'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Превышено время ожидания получения геопозиции'));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve(position);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0
      }
    );
  });
};

// Function to verify if user is at the object location
export const verifyUserAtObject = async (
  polygon: any,
  returnPosition: boolean = false
): Promise<[boolean, GeolocationPosition?]> => {
  try {
    const position = await getCurrentPosition();
    const userLocation = [position.coords.latitude, position.coords.longitude];
    
    // Log user's location for debugging
    console.log('User Location:', {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
      accuracy: position.coords.accuracy + ' meters'
    });

    console.log('User Location (formatted):', userLocation);
    console.log('Object Polygon:', polygon);
    console.log('Polygon Coordinates:', polygon.coordinates);

    // Calculate distances to all vertices
    const distances = polygon.coordinates.map((coord: [number, number], index: number) => {
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        coord[0], coord[1]
      );
      console.log(`Distance to vertex ${index + 1}:`, distance.toFixed(2), 'meters');
      return distance;
    });

    // Find the minimum distance to any vertex
    const minDistance = Math.min(...distances);
    console.log('Minimum distance to polygon:', minDistance.toFixed(2), 'meters');

    // Calculate the center point of the polygon
    const center = calculatePolygonCenter(polygon.coordinates);
    const distanceToCenter = calculateDistance(
      userLocation[0], userLocation[1],
      center[0], center[1]
    );
    console.log('Distance to polygon center:', distanceToCenter.toFixed(2), 'meters');

    // Calculate maximum allowed distance based on GPS accuracy and a buffer
    const maxAllowedDistance = position.coords.accuracy + 100; // GPS accuracy plus 100 meter buffer
    console.log('Maximum allowed distance:', maxAllowedDistance, 'meters');

    // Consider user inside if they are within the allowed distance of either:
    // 1. Any vertex
    // 2. The center of the polygon
    const isNearEnough = minDistance <= maxAllowedDistance || distanceToCenter <= maxAllowedDistance;

    console.log('Is user near enough to object:', isNearEnough);
    return returnPosition ? [isNearEnough, position] : [isNearEnough];

  } catch (error: any) {
    console.error('Error getting location:', error);
    throw new Error('Превышено время ожидания получения геопозиции');
  }
};

// Calculate the center point of a polygon
function calculatePolygonCenter(coordinates: Array<[number, number]>): [number, number] {
  const length = coordinates.length;
  const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / length;
  const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / length;
  return [centerLat, centerLng];
}

// Existing calculateDistance function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
