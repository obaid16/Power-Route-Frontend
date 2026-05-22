import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { api, getApiBaseUrl } from '../services/apiClient';
import { DEFAULT_MAP_CENTER } from '../constants/defaults';
import { nearestStation } from '../utils/geo';
import { mapStationFromApi, mapVehicleFromUser } from '../utils/mappers';
import { useAuth } from './AuthContext';

const EMPTY_VEHICLE = {
  batteryPct: 0,
  rangeKm: 0,
  isCharging: false,
  chargeKw: 0,
  timeToFullMin: 0,
  ecoScore: 0,
  monthlySpendUsd: 0,
  evVehicleModel: '',
  batteryCapacityKwh: 60,
};

const VoltDataContext = createContext(null);

export function VoltDataProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [stations, setStations] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [userCoord, setUserCoord] = useState(DEFAULT_MAP_CENTER);
  const [locationNote, setLocationNote] = useState(null);

  const resolveLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
        if (pos?.coords) {
          const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserCoord(c);
          setLocationNote(null);
          return c;
        }
      }
    } catch (err) {
      console.warn('GPS location failed:', err);
    }
    
    // IP-based Fallback
    try {
      const res = await fetch('https://freeipapi.com/api/json');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const c = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
        setUserCoord(c);
        setLocationNote('Using IP-based network location.');
        return c;
      }
    } catch (ipErr) {
      console.warn('IP fallback failed:', ipErr);
    }

    setLocationNote('Location denied/failed — using default map center.');
    setUserCoord(DEFAULT_MAP_CENTER);
    return DEFAULT_MAP_CENTER;
  }, []);


  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLastError(null);
    try {
      const coord = await resolveLocation();
      const lat = coord.latitude;
      const lng = coord.longitude;
      const [stationsRes, rangeRes, histRes, ecoRes, costRes] = await Promise.all([
        api(`/stations/ocm/nearby?lat=${lat}&lng=${lng}&distanceKm=25`, { auth: false }),
        api('/ai/predict-range', {
          method: 'POST',
          body: {
            batteryPercentage: user?.vehicle?.currentBatteryPercent ?? 50,
            vehicleBatteryCapacityKwh: user?.vehicle?.batteryCapacityKwh ?? 60,
          },
        }).catch(() => null),
        api('/bookings/history').catch(() => ({ data: { history: [] } })),
        api('/analytics/eco-score').catch(() => ({ data: { ecoScore: 0 } })),
        api('/analytics/costs').catch(() => ({ data: { costs: { estimatedTotalCost: 0 } } })),
      ]);
      const list = (stationsRes.data?.stations || []).map(mapStationFromApi);
      setStations(list);
      const active = (histRes.data?.history || []).find((b) => b.status === 'active');
      setVehicle(
        mapVehicleFromUser(user, {
          rangeKm: rangeRes?.data?.estimatedRemainingDistanceKm ?? 0,
          isCharging: Boolean(active),
          chargeKw: active?.chargingStation?.chargingSpeedKw ?? 0,
          timeToFullMin: active ? 45 : 0,
          ecoScore: ecoRes?.data?.ecoScore ?? 0,
          monthlySpendUsd: costRes?.data?.costs?.estimatedTotalCost ?? 0,
        })
      );
    } catch (e) {
      setLastError(e.message || 'Failed to load data');
      setStations([]);
      setVehicle(mapVehicleFromUser(user, {}));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, resolveLocation]);

  const refreshLocation = useCallback(async () => {
    await resolveLocation();
    if (isAuthenticated) await refresh();
  }, [resolveLocation, isAuthenticated, refresh]);

  // duplicate refresh logic removed

  useEffect(() => {
    if (isAuthenticated && user) refresh();
    else {
      setStations([]);
      setVehicle(EMPTY_VEHICLE);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const nearest = nearestStation(userCoord, stations);
  const value = useMemo(
    () => ({
      loading,
      vehicle,
      stations,
      lastError,
      apiBaseUrl,
      userCoord,
      locationNote,
      refresh,
      refreshLocation,
      nearestStation: nearest,
      source: lastError ? 'error' : stations.length ? 'api' : 'empty',
    }),
    [loading, vehicle, stations, lastError, apiBaseUrl, userCoord, locationNote, refresh, refreshLocation, nearest]
  );

  return <VoltDataContext.Provider value={value}>{children}</VoltDataContext.Provider>;
}

export function useVoltData() {
  const ctx = useContext(VoltDataContext);
  if (!ctx) throw new Error('useVoltData must be used within VoltDataProvider');
  return ctx;
}

/** @deprecated use useVoltData */
export function useVoltApi() {
  const d = useVoltData();
  return {
    loading: d.loading,
    vehicle: d.vehicle,
    stations: d.stations,
    source: d.source,
    lastError: d.lastError,
    apiBaseUrl: d.apiBaseUrl,
    userCoord: d.userCoord,
    locationNote: d.locationNote,
    refresh: d.refresh,
  };
}
