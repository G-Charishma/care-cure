import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export interface Facility {
  id: string;
  type: 'store' | 'hospital';
  name: string;
  distance: string;
  distanceKm: number;
  isOpen: boolean;
  openText: string;
  address: string;
  phone: string;
  emergencyAvailable?: boolean;
  availableMedicines?: string[];
  lat: number;
  lng: number;
  rating?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  type: string;
  streetName: string;
}

export interface RouteData {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
  steps: RouteStep[];
  mode: 'driving' | 'walking' | 'cycling';
}

// Built-in Geocoding Dictionary for instant offline/online resolution
const CITY_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  'bengaluru': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, Karnataka, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, Karnataka, India' },
  'indiranagar': { lat: 12.9716, lng: 77.6412, label: 'Indiranagar, Bengaluru, India' },
  'koramangala': { lat: 12.9352, lng: 77.6245, label: 'Koramangala, Bengaluru, India' },
  'whitefield': { lat: 12.9698, lng: 77.7499, label: 'Whitefield, Bengaluru, India' },
  'jayanagar': { lat: 12.9308, lng: 77.5838, label: 'Jayanagar, Bengaluru, India' },
  'mumbai': { lat: 19.0760, lng: 72.8777, label: 'Mumbai, Maharashtra, India' },
  'bandra': { lat: 19.0596, lng: 72.8295, label: 'Bandra, Mumbai, India' },
  'delhi': { lat: 28.6139, lng: 77.2090, label: 'New Delhi, Delhi, India' },
  'new delhi': { lat: 28.6139, lng: 77.2090, label: 'New Delhi, Delhi, India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad, Telangana, India' },
  'chennai': { lat: 13.0827, lng: 80.2707, label: 'Chennai, Tamil Nadu, India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, label: 'Kolkata, West Bengal, India' },
  'pune': { lat: 18.5204, lng: 73.8567, label: 'Pune, Maharashtra, India' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad, Gujarat, India' },
  'new york': { lat: 40.7128, lng: -74.0060, label: 'New York, NY, USA' },
  'london': { lat: 51.5074, lng: -0.1278, label: 'London, UK' },
  'singapore': { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  'dubai': { lat: 25.2048, lng: 55.2708, label: 'Dubai, UAE' },
  'sydney': { lat: -33.8688, lng: 151.2093, label: 'Sydney, Australia' },
  'tokyo': { lat: 35.6762, lng: 139.6503, label: 'Tokyo, Japan' },
  'toronto': { lat: 43.6532, lng: -79.3832, label: 'Toronto, Canada' },
  'paris': { lat: 48.8566, lng: 2.3522, label: 'Paris, France' },
  'berlin': { lat: 52.5200, lng: 13.4050, label: 'Berlin, Germany' },
};

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export function generateFacilitiesForLocation(centerLat: number, centerLng: number, areaName: string = 'Current Area'): { stores: Facility[]; hospitals: Facility[] } {
  const storeTemplates = [
    { name: 'Apollo Pharmacy 24/7', addressOffset: 'Main Boulevard, Central Hub', phone: '+91 80 2211 4455', openText: 'Open 24/7', isOpen: true, rating: 4.9, meds: ['ParaCure 500mg', 'AllergyRelief Cetirizine', 'CoughSyrup Soothe', 'VitaGlow C', 'DigestEase'] },
    { name: 'MedPlus Healthcare & Medicals', addressOffset: 'Cross Road, Near Market', phone: '+91 80 3322 1100', openText: 'Open Now (Closes 11 PM)', isOpen: true, rating: 4.8, meds: ['IbuAct Fast', 'DermaCream Plus', 'OmepraGuard', 'PoviHeal 10%'] },
    { name: 'Wellness Forever 24x7 Chemist', addressOffset: 'Commercial Complex, Sector 4', phone: '+91 80 4455 6677', openText: 'Open 24/7', isOpen: true, rating: 4.9, meds: ['AllerDrop Drops', 'FlexiJoint MSM', 'CarePlast Kit', 'SleepWell Melatonin'] },
    { name: 'Care&Cure Express Pharmacy', addressOffset: 'Health Square Plaza', phone: '+91 80 5566 7788', openText: 'Open Now', isOpen: true, rating: 4.7, meds: ['HydraBoost ORS', 'VoltaRelief Gel', 'ThroatCalm Lozenges'] },
    { name: 'Guardian Life Medicals', addressOffset: 'Parkview Avenue, Block B', phone: '+91 80 6677 8899', openText: 'Open Now', isOpen: true, rating: 4.6, meds: ['DailyMulti Gold', 'FexoShield 180mg', 'MucusClear 600mg'] },
    { name: 'City Central Chemist & Druggist', addressOffset: 'Station Road Junction', phone: '+91 80 7788 9900', openText: 'Open Now (Closes 10:30 PM)', isOpen: true, rating: 4.8, meds: ['MigraStop Action', 'BurnCool Cream', 'D3 SunBoost'] },
  ];

  const hospitalTemplates = [
    { name: 'City General & Multi-Specialty Hospital', addressOffset: 'Hospital Road, Sector 1', phone: '+91 80 2500 0000', emergencyAvailable: true, rating: 4.9 },
    { name: 'St. John Trauma & Emergency Center', addressOffset: 'Expressway Junction, Ring Road', phone: '+91 80 2600 1111', emergencyAvailable: true, rating: 4.8 },
    { name: 'LifeLine Critical Care & ICU', addressOffset: 'Medical Enclave, East Wing', phone: '+91 80 2700 2222', emergencyAvailable: true, rating: 4.7 },
    { name: 'Fortis Healthcare Community Clinic', addressOffset: 'Civic Centre Road', phone: '+91 80 2800 3333', emergencyAvailable: false, rating: 4.6 },
  ];

  // Disperse realistic offsets (approx 0.4km to 2.8km)
  const offsetsStores = [
    { dLat: 0.0042, dLng: 0.0035 },
    { dLat: -0.0051, dLng: 0.0062 },
    { dLat: 0.0078, dLng: -0.0045 },
    { dLat: -0.0085, dLng: -0.0071 },
    { dLat: 0.0112, dLng: 0.0089 },
    { dLat: -0.0035, dLng: 0.0125 },
  ];

  const offsetsHospitals = [
    { dLat: 0.0065, dLng: 0.0075 },
    { dLat: -0.0120, dLng: 0.0090 },
    { dLat: 0.0145, dLng: -0.0110 },
    { dLat: -0.0095, dLng: -0.0140 },
  ];

  const stores: Facility[] = storeTemplates.map((t, idx) => {
    const lat = centerLat + offsetsStores[idx].dLat;
    const lng = centerLng + offsetsStores[idx].dLng;
    const distKm = calculateDistanceKm(centerLat, centerLng, lat, lng);
    return {
      id: `store-${idx + 1}`,
      type: 'store',
      name: t.name,
      distanceKm: distKm,
      distance: `${distKm} km away`,
      isOpen: t.isOpen,
      openText: t.openText,
      address: `${t.addressOffset}, ${areaName}`,
      phone: t.phone,
      availableMedicines: t.meds,
      lat,
      lng,
      rating: t.rating,
    };
  });

  const hospitals: Facility[] = hospitalTemplates.map((t, idx) => {
    const lat = centerLat + offsetsHospitals[idx].dLat;
    const lng = centerLng + offsetsHospitals[idx].dLng;
    const distKm = calculateDistanceKm(centerLat, centerLng, lat, lng);
    return {
      id: `hosp-${idx + 1}`,
      type: 'hospital',
      name: t.name,
      distanceKm: distKm,
      distance: `${distKm} km away`,
      isOpen: true,
      openText: 'Open 24/7 (Emergency)',
      address: `${t.addressOffset}, ${areaName}`,
      phone: t.phone,
      emergencyAvailable: t.emergencyAvailable,
      lat,
      lng,
      rating: t.rating,
    };
  });

  return { stores, hospitals };
}

export async function geocodeSearch(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const clean = query.trim().toLowerCase();
  // Check local dictionary first
  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    if (clean.includes(key)) {
      return { lat: val.lat, lng: val.lng, displayName: val.label };
    }
  }

  // Use Nominatim OpenStreetMap Geocoding API
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (err) {
    console.warn('Nominatim geocode failed, using fallback coordinates', err);
  }

  return { lat: 12.9716, lng: 77.5946, displayName: query };
}

// Fetch authentic road routing from OSRM
export async function fetchOsrmRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteData> {
  const osrmProfile = mode === 'walking' ? 'walking' : (mode === 'cycling' ? 'cycling' : 'driving');
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distKm = parseFloat((route.distance / 1000).toFixed(2));
      const durMin = Math.max(1, Math.round(route.duration / 60));
      const coordinates: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
      
      const steps: RouteStep[] = [];
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.forEach((s: any) => {
          if (s.maneuver) {
            const mType = s.maneuver.type || 'turn';
            const modifier = s.maneuver.modifier ? ` (${s.maneuver.modifier})` : '';
            const street = s.name ? s.name : 'Connecting Road';
            let text = `${mType}${modifier} on ${street}`;
            if (mType === 'depart') text = `Head out on ${street}`;
            if (mType === 'arrive') text = `Arrive at destination on ${street}`;
            steps.push({
              instruction: text,
              distanceMeters: Math.round(s.distance),
              type: mType,
              streetName: street
            });
          }
        });
      }

      return {
        distanceKm: distKm,
        durationMinutes: durMin,
        coordinates,
        steps,
        mode
      };
    }
  } catch (e) {
    console.warn('OSRM router failed, falling back to geodesic path', e);
  }

  // Fallback direct interpolated route
  const dist = calculateDistanceKm(startLat, startLng, endLat, endLng);
  const dur = mode === 'walking' ? Math.round(dist * 13) : (mode === 'cycling' ? Math.round(dist * 6) : Math.round(dist * 3.5));
  const waypoints: [number, number][] = [];
  const numSteps = 15;
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    // Add realistic slight curve
    const lat = startLat + (endLat - startLat) * t + Math.sin(t * Math.PI) * 0.0015;
    const lng = startLng + (endLng - startLng) * t + Math.cos(t * Math.PI) * 0.0015;
    waypoints.push([lat, lng]);
  }

  return {
    distanceKm: dist,
    durationMinutes: Math.max(2, dur),
    coordinates: waypoints,
    steps: [
      { instruction: 'Start from your set location', distanceMeters: Math.round(dist * 200), type: 'depart', streetName: 'Main Access Road' },
      { instruction: 'Continue along main arterial road', distanceMeters: Math.round(dist * 500), type: 'continue', streetName: 'Healthcare Corridor' },
      { instruction: 'Turn towards destination approach', distanceMeters: Math.round(dist * 300), type: 'turn', streetName: 'Facility Entrance' },
      { instruction: 'Arrive at destination facility', distanceMeters: 0, type: 'arrive', streetName: 'Destination' },
    ],
    mode
  };
}

interface InteractiveMapProps {
  userCoords: { lat: number; lng: number };
  userAddress: string;
  selectedFacility: Facility | null;
  onSelectFacility: (fac: Facility) => void;
  facilities: Facility[];
  filterType: 'all' | 'stores' | 'hospitals';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userCoords,
  userAddress,
  selectedFacility,
  onSelectFacility,
  facilities,
  filterType
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const navAnimMarkerRef = useRef<L.CircleMarker | null>(null);

  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when userCoords change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 14, { animate: true });
    }
  }, [userCoords.lat, userCoords.lng]);

  // Render Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    // 1. User Location Pin (Glowing Blue Beacon)
    const userIconHtml = `
      <div class="user-map-beacon">
        <div class="beacon-core">📍</div>
        <div class="beacon-pulse"></div>
      </div>
    `;
    const userMarkerIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userMarkerIcon })
      .bindPopup(`<div style="font-weight:700; color:#004346; padding:4px;">📍 Your Set Location<br/><span style="font-weight:400; font-size:12px; color:#555;">${userAddress}</span></div>`);
    markersGroupRef.current.addLayer(userMarker);

    // 2. Facilities Pins
    const visibleFacilities = facilities.filter(f => {
      if (filterType === 'stores') return f.type === 'store';
      if (filterType === 'hospitals') return f.type === 'hospital';
      return true;
    });

    visibleFacilities.forEach(f => {
      const isStore = f.type === 'store';
      const isSelected = selectedFacility?.id === f.id;
      const markerColor = isStore ? '#00796b' : '#d93025';
      const markerEmoji = isStore ? '💊' : '🏥';
      
      const pinHtml = `
        <div class="facility-map-marker ${isSelected ? 'selected-marker' : ''}" style="background-color: ${markerColor};">
          <span class="pin-icon">${markerEmoji}</span>
          <span class="pin-label">${f.name.split(' ')[0]}</span>
        </div>
      `;

      const facilityIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-facility-marker',
        iconSize: [110, 34],
        iconAnchor: [55, 34]
      });

      const marker = L.marker([f.lat, f.lng], { icon: facilityIcon })
        .on('click', () => {
          onSelectFacility(f);
        })
        .bindPopup(`
          <div style="padding:6px; min-width:180px;">
            <strong style="color:${markerColor}; font-size:14px;">${markerEmoji} ${f.name}</strong>
            <p style="margin:4px 0; font-size:12px; color:#555;">📍 ${f.distance} • ${f.address}</p>
            <p style="margin:4px 0; font-weight:600; font-size:12px; color:${f.isOpen ? '#00875a' : '#d93025'};">${f.openText}</p>
            <button id="btn-calc-route-${f.id}" style="width:100%; margin-top:6px; padding:4px 8px; background:${markerColor}; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;">
              Get Efficient Route 🚀
            </button>
          </div>
        `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-calc-route-${f.id}`);
        if (btn) {
          btn.onclick = () => onSelectFacility(f);
        }
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [userCoords, userAddress, facilities, filterType, selectedFacility]);

  // Fetch & Draw Road Polyline when Destination changes or Travel Mode changes
  useEffect(() => {
    if (!selectedFacility) {
      if (routePolylineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
      setRouteData(null);
      setIsNavigating(false);
      return;
    }

    let isMounted = true;
    setRouteLoading(true);

    fetchOsrmRoute(userCoords.lat, userCoords.lng, selectedFacility.lat, selectedFacility.lng, travelMode)
      .then(route => {
        if (!isMounted) return;
        setRouteData(route);
        setRouteLoading(false);

        if (mapInstanceRef.current) {
          if (routePolylineRef.current) {
            mapInstanceRef.current.removeLayer(routePolylineRef.current);
          }

          // Create dynamic path line
          const polyline = L.polyline(route.coordinates, {
            color: '#0066cc',
            weight: 6,
            opacity: 0.85,
            lineJoin: 'round',
            dashArray: travelMode === 'walking' ? '8, 8' : undefined
          }).addTo(mapInstanceRef.current);

          routePolylineRef.current = polyline;

          // Fit bounds to show entire route with padding
          const bounds = L.latLngBounds([
            [userCoords.lat, userCoords.lng],
            [selectedFacility.lat, selectedFacility.lng],
            ...route.coordinates
          ]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      })
      .catch(err => {
        console.error('Failed to get route directions:', err);
        if (isMounted) setRouteLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFacility, travelMode, userCoords]);

  // Live Navigation Animation Loop
  useEffect(() => {
    if (!isNavigating || !routeData || !routeData.coordinates.length || !mapInstanceRef.current) return;

    if (!navAnimMarkerRef.current) {
      navAnimMarkerRef.current = L.circleMarker(routeData.coordinates[0], {
        radius: 9,
        fillColor: '#00e5ff',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(mapInstanceRef.current);
    }

    let currentIndex = 0;
    const totalPoints = routeData.coordinates.length;
    const interval = setInterval(() => {
      if (currentIndex >= totalPoints - 1) {
        clearInterval(interval);
        setIsNavigating(false);
        setNavProgress(100);
        return;
      }
      currentIndex++;
      const currentPoint = routeData.coordinates[currentIndex];
      navAnimMarkerRef.current?.setLatLng(currentPoint);
      mapInstanceRef.current?.panTo(currentPoint, { animate: true, duration: 0.2 });
      setNavProgress(Math.round((currentIndex / (totalPoints - 1)) * 100));
    }, 300);

    return () => {
      clearInterval(interval);
      if (navAnimMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(navAnimMarkerRef.current);
        navAnimMarkerRef.current = null;
      }
    };
  }, [isNavigating, routeData]);

  return (
    <div className="interactive-map-wrapper fade-in">
      {/* Top Map Header & Mode Bar */}
      <div className="map-toolbar">
        <div className="map-location-badge">
          <span className="dot-pulse"></span>
          <span><strong>Origin:</strong> {userAddress}</span>
        </div>

        {selectedFacility && (
          <div className="map-destination-badge">
            <span>🏁 <strong>Destination:</strong> {selectedFacility.name}</span>
          </div>
        )}

        <div className="map-mode-toggles">
          <button
            className={`mode-btn ${travelMode === 'driving' ? 'active' : ''}`}
            onClick={() => setTravelMode('driving')}
            title="Driving Route"
          >
            🚗 Driving
          </button>
          <button
            className={`mode-btn ${travelMode === 'walking' ? 'active' : ''}`}
            onClick={() => setTravelMode('walking')}
            title="Walking Route"
          >
            🚶 Walking
          </button>
          <button
            className={`mode-btn ${travelMode === 'cycling' ? 'active' : ''}`}
            onClick={() => setTravelMode('cycling')}
            title="Cycling Route"
          >
            🚴 Cycling
          </button>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div className="leaflet-map-container" ref={mapContainerRef} style={{ width: '100%', height: '420px', borderRadius: '16px', zIndex: 1 }}></div>

      {/* Route & Directions Info Card when Facility is Selected */}
      {selectedFacility && (
        <div className="route-details-panel fade-in">
          <div className="route-details-header">
            <div className="facility-summary">
              <span className="fac-type-icon">{selectedFacility.type === 'store' ? '💊' : '🏥'}</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{selectedFacility.name}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#666' }}>{selectedFacility.address}</p>
              </div>
            </div>

            <div className="route-stats">
              {routeLoading ? (
                <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Calculating efficient route...</div>
              ) : routeData ? (
                <>
                  <div className="stat-box">
                    <span className="stat-label">Fastest Route</span>
                    <span className="stat-val">{routeData.distanceKm} km</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Estimated Time</span>
                    <span className="stat-val highlight">{routeData.durationMinutes} mins</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Traffic Status</span>
                    <span className="stat-val status-green">🟢 Smooth Flow</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="route-actions-row">
            <button
              className={`btn-primary ${isNavigating ? 'nav-active' : ''}`}
              onClick={() => setIsNavigating(!isNavigating)}
              style={{ flex: 1 }}
            >
              {isNavigating ? `⏸️ Pause Simulation (${navProgress}%)` : '▶️ Live GPS Navigation Simulation'}
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedFacility.lat},${selectedFacility.lng}&travelmode=${travelMode}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
            >
              🗺️ Open in Google Maps ↗
            </a>
          </div>

          {/* Turn-by-Turn Steps */}
          {routeData && routeData.steps.length > 0 && (
            <div className="turn-by-turn-section">
              <h5 style={{ margin: '0.8rem 0 0.5rem 0', color: 'var(--color-primary)' }}>Turn-by-Turn Road Directions:</h5>
              <div className="steps-list">
                {routeData.steps.map((st, sIdx) => (
                  <div key={sIdx} className="step-item">
                    <span className="step-index">{sIdx + 1}</span>
                    <div className="step-content">
                      <span className="step-instruction">{st.instruction}</span>
                      {st.distanceMeters > 0 && (
                        <span className="step-dist">({st.distanceMeters} meters)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
