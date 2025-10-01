import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import styles from './YMap.module.scss';

interface YMapProps {
  center: [number, number];
  zoom?: number;
  coordinates: Array<[number, number]>;
  editable?: boolean;
  onChange?: (coordinates: Array<[number, number]>) => void;
}

export const YMap: FC<YMapProps> = ({
  center,
  zoom = 17,
  coordinates,
  editable = false,
  onChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    // @ts-ignore
    if (window.ymaps) {
      // @ts-ignore
      window.ymaps.ready(() => {
        // @ts-ignore
        const map = new window.ymaps.Map(mapElement, {
          center,
          zoom,
          controls: ['zoomControl']
        });

        if (coordinates.length > 0) {
          // Важно! Полигон принимает массив массивов координат
          const polygonCoordinates = coordinates.length >= 3 
            ? [[...coordinates, coordinates[0]]] // Замыкаем полигон для 3+ точек
            : [coordinates]; // Для 1-2 точек оставляем как есть

          // @ts-ignore
          const polygon = new window.ymaps.Polygon(polygonCoordinates, {
            hintContent: 'Область проведения работ'
          }, {
            fillColor: '#ff000066',
            strokeColor: '#ff0000',
            strokeWidth: 4,
            editorDrawingCursor: 'crosshair',
            editorMaxPoints: 100,
            draggable: editable
          });

          map.geoObjects.add(polygon);

          if (editable) {
            polygon.editor.startEditing();
            polygon.geometry.events.add('change', () => {
              const coords = polygon.geometry.getCoordinates();
              const actualCoords = coords[0].slice(0, -1);
              onChange?.(actualCoords);
            });
          }

          // Центрируем карту на полигоне
          const bounds = polygon.geometry.getBounds();
          if (bounds) {
            map.setBounds(bounds, {
              checkZoomRange: true,
              duration: 300,
              zoomMargin: 100
            });
          }
        }

        return () => {
          map.destroy();
        };
      });
    }
  }, [coordinates, center, zoom, editable, onChange]);

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map}></div>
    </div>
  );
};

