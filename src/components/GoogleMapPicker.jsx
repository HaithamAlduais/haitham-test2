import { useEffect, useRef } from "react";

const MAPS_API_KEY = "AIzaSyAF-5o1Fy98yLsjCvUIZUAGrSN8gh7OJjw";

export default function GoogleMapPicker({ location, onLocationChange, placeholder }) {
  const containerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;

    // Render the Google Maps components via innerHTML to avoid React's key prop conflict
    containerRef.current.innerHTML = `
      <gmpx-api-loader key="${MAPS_API_KEY}" solution-channel="GMP_GE_mapsandplacesautocomplete_v2"></gmpx-api-loader>
      <gmp-map center="${location?.lat && location?.lng ? `${location.lat},${location.lng}` : '24.7136,46.6753'}" zoom="11" map-id="RAMSHA_MAP" style="width:100%;height:300px;border-radius:8px;overflow:hidden;border:2px solid var(--border)">
        <div slot="control-block-start-inline-start" style="padding:12px">
          <gmpx-place-picker placeholder="${placeholder || 'ابحث عن الموقع...'}" style="width:300px"></gmpx-place-picker>
        </div>
        <gmp-advanced-marker></gmp-advanced-marker>
      </gmp-map>
    `;

    const init = async () => {
      try {
        await customElements.whenDefined("gmp-map");
        initialized.current = true;

        const map = containerRef.current?.querySelector("gmp-map");
        const marker = containerRef.current?.querySelector("gmp-advanced-marker");
        const picker = containerRef.current?.querySelector("gmpx-place-picker");

        if (!map || !picker) return;

        map.innerMap?.setOptions({ mapTypeControl: false });

        if (location?.lat && location?.lng) {
          map.center = { lat: location.lat, lng: location.lng };
          map.zoom = 15;
          if (marker) marker.position = { lat: location.lat, lng: location.lng };
        }

        picker.addEventListener("gmpx-placechange", () => {
          const place = picker.value;
          if (!place?.location) return;

          if (place.viewport) {
            map.innerMap.fitBounds(place.viewport);
          } else {
            map.center = place.location;
            map.zoom = 17;
          }

          if (marker) marker.position = place.location;

          onLocationChange?.({
            name: place.displayName || "",
            address: place.formattedAddress || "",
            lat: place.location.lat(),
            lng: place.location.lng(),
          });
        });
      } catch (err) {
        console.warn("[GoogleMapPicker] Init error:", err);
      }
    };

    setTimeout(init, 800);
  }, []);

  return <div ref={containerRef} className="space-y-3" />;
}
