import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState, useEffect, useRef } from "react";

type Props = {
  center?: [number, number];
  onMapClick?: (lat: number, lng: number) => void;
};

function MapPointArea({ center, onMapClick }: Props) {
  const [viewState, setViewState] = useState({
    longitude: center?.[1] ?? -47.93,
    latitude: center?.[0] ?? -15.78,
    zoom: 17,
  });
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const initialFlightDone = useRef(false);

  useEffect(() => {
    if (!center) return;

    if (!initialFlightDone.current) {
      setViewState((prev) => ({
        ...prev,
        latitude: center[0],
        longitude: center[1],
        zoom: 17,
      }));
      initialFlightDone.current = true;
    } else {
      setViewState((prev) => ({
        ...prev,
        latitude: center[0],
        longitude: center[1],
      }));
    }
  }, [center]);

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      maxZoom={22}
      style={{ width: "100%", height: "100%" }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      onClick={(e) => {
        const { lng, lat } = e.lngLat;
        setMarker([lat, lng]);
        onMapClick?.(lat, lng);
      }}
    >
      <NavigationControl position="bottom-right" />
      {marker && <Marker latitude={marker[0]} longitude={marker[1]} />}
    </Map>
  );
}

export default MapPointArea;
