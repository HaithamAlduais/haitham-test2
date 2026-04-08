import { useEffect, useRef } from "react";

/**
 * Google Maps Place Picker using Extended Component Library.
 * Renders a map with a place search box and marker.
 *
 * @param {object} props
 * @param {object} props.location - { name, address, lat, lng }
 * @param {function} props.onLocationChange - callback with { name, address, lat, lng }
 * @param {string} props.placeholder - search placeholder text
 */
export default function GoogleMapPicker({ location, onLocationChange, placeholder }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pickerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const init = async () => {
      await customElements.whenDefined("gmp-map");
      initialized.current = true;

      const map = mapRef.current;
      const marker = markerRef.current;
      const picker = pickerRef.current;

      if (!map || !picker) return;

      map.innerMap?.setOptions({ mapTypeControl: false });

      // Set initial position if location has lat/lng
      if (location?.lat && location?.lng) {
        map.center = { lat: location.lat, lng: location.lng };
        map.zoom = 15;
        marker.position = { lat: location.lat, lng: location.lng };
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

        marker.position = place.location;

        onLocationChange?.({
          name: place.displayName || "",
          address: place.formattedAddress || "",
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      });
    };

    // Wait a bit for custom elements to register
    const timer = setTimeout(init, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3">
      <gmpx-api-loader
        key="AIzaSyAF-5o1Fy98yLsjCvUIZUAGrSN8gh7OJjw"
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
      />
      <gmp-map
        ref={mapRef}
        center={location?.lat && location?.lng ? `${location.lat},${location.lng}` : "24.7136,46.6753"}
        zoom="11"
        map-id="RAMSHA_MAP"
        style={{ width: "100%", height: "300px", borderRadius: "8px", overflow: "hidden", border: "2px solid var(--border)" }}
      >
        <div slot="control-block-start-inline-start" style={{ padding: "12px" }}>
          <gmpx-place-picker
            ref={pickerRef}
            placeholder={placeholder || "ابحث عن الموقع..."}
            style={{ width: "300px" }}
          />
        </div>
        <gmp-advanced-marker ref={markerRef} />
      </gmp-map>
    </div>
  );
}
