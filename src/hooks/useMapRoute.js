import { useEffect, useState } from 'react';
import { buildFallbackRoute, fetchDrivingRoute } from '../services/directionsService';

export function useMapRoute(userCoord, targetStation) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [etaKm, setEtaKm] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetStation || userCoord == null) {
      setRouteCoords([]);
      setEtaMinutes(0);
      setEtaKm(0);
      setSteps([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const dest = { latitude: targetStation.latitude, longitude: targetStation.longitude };
      const google = await fetchDrivingRoute(userCoord, dest);
      if (cancelled) return;
      if (google?.coordinates?.length) {
        setRouteCoords(google.coordinates);
        setEtaMinutes(google.durationMinutes);
        setEtaKm(google.distanceKm);
        setSteps(google.steps || []);
      } else {
        const fb = buildFallbackRoute(userCoord, dest);
        setRouteCoords(fb.coordinates);
        setEtaMinutes(fb.durationMinutes);
        setEtaKm(fb.distanceKm);
        setSteps(fb.steps || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userCoord?.latitude, userCoord?.longitude, targetStation?.id, targetStation?.latitude, targetStation?.longitude]);

  return { routeCoords, etaMinutes, etaKm, steps, loading };
}
