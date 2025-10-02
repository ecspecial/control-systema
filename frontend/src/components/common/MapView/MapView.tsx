import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './MapView.module.scss';

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  coordinates: Array<[number, number]>;
  editable?: boolean;
  onChange?: (coordinates: Array<[number, number]>) => void;
}

export const MapView: FC<MapViewProps> = ({
  center,
  zoom = 17,
  coordinates,
  editable = false,
  onChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const midpointMarkersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap Contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: center,
        zoom: zoom
      });

      const map = mapInstanceRef.current;

      map.on('load', () => {
        updatePolygon(coordinates);
      });
    } else {
      updatePolygon(coordinates);
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      midpointMarkersRef.current.forEach(marker => marker.remove());
      midpointMarkersRef.current = [];
    };
  }, [coordinates, center, zoom, editable]);

  const updatePolygon = (coords: Array<[number, number]>) => {
    const map = mapInstanceRef.current;
    if (!map || !map.loaded()) return;

    console.log('Updating polygon with coordinates:', coords);

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    midpointMarkersRef.current.forEach(marker => marker.remove());
    midpointMarkersRef.current = [];

    // Remove existing source and layers
    if (map.getSource('area')) {
      if (map.getLayer('area-fill')) map.removeLayer('area-fill');
      if (map.getLayer('area-outline')) map.removeLayer('area-outline');
      map.removeSource('area');
    }

    if (coords.length === 0) return;

    const polygonCoords = [...coords, coords[0]];

    // Add polygon source
    map.addSource('area', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        }
      }
    });

    // Add fill layer
    map.addLayer({
      id: 'area-fill',
      type: 'fill',
      source: 'area',
      paint: {
        'fill-color': '#ff0000',
        'fill-opacity': 0.2
      }
    });

    // Add outline layer
    map.addLayer({
      id: 'area-outline',
      type: 'line',
      source: 'area',
      paint: {
        'line-color': '#ff0000',
        'line-width': 2
      }
    });

    const bounds = new maplibregl.LngLatBounds();
    coords.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 50, maxZoom: zoom });

    if (editable && onChange) {
      coords.forEach((coord, index) => {
        const markerEl = document.createElement('div');
        markerEl.className = styles.marker;
        markerEl.style.width = '12px';
        markerEl.style.height = '12px';
        markerEl.style.backgroundColor = '#ff0000';
        markerEl.style.border = '2px solid white';
        markerEl.style.borderRadius = '50%';
        markerEl.style.cursor = 'move';
        markerEl.style.boxShadow = '0 0 4px rgba(0,0,0,0.4)';
        markerEl.style.zIndex = '10';

        const marker = new maplibregl.Marker({
          element: markerEl,
          draggable: true
        })
          .setLngLat(coord)
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const newCoords = [...coords];
          newCoords[index] = [lngLat.lng, lngLat.lat];
          console.log('Marker dragged, new coords:', newCoords);
          onChange(newCoords);
        });

        markersRef.current.push(marker);
      });

      // Update midpoint markers
      for (let i = 0; i < coords.length; i++) {
        const nextIndex = (i + 1) % coords.length;
        const coord1 = coords[i];
        const coord2 = coords[nextIndex];

        // Calculate midpoint (in [lng, lat])
        const midLng = (coord1[0] + coord2[0]) / 2;
        const midLat = (coord1[1] + coord2[1]) / 2;

        const midpointEl = document.createElement('div');
        midpointEl.className = styles.marker;
        midpointEl.style.width = '12px';
        midpointEl.style.height = '12px';
        midpointEl.style.backgroundColor = '#ff0000';
        midpointEl.style.border = '2px solid white';
        midpointEl.style.borderRadius = '50%';
        midpointEl.style.cursor = 'move';
        midpointEl.style.boxShadow = '0 0 4px rgba(0,0,0,0.4)';
        midpointEl.style.zIndex = '10';

        const midpointMarker = new maplibregl.Marker({
          element: midpointEl,
          draggable: true
        })
          .setLngLat([midLng, midLat])
          .addTo(map);

        midpointMarker.on('dragend', () => {
          const lngLat = midpointMarker.getLngLat();
          const newCoords = [...coords];
          newCoords.splice(nextIndex, 0, [lngLat.lng, lngLat.lat]);
          console.log('Midpoint dragged, new coords:', newCoords);
          onChange(newCoords);
        });

        midpointMarkersRef.current.push(midpointMarker);
      }
    }
  };

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map}></div>
    </div>
  );
};
