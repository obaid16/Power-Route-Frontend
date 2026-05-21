import { api } from './apiClient';

/**
 * Fetch nearby places (police, hospital, hotel) from Geoapify
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} category 
 * @param {number} limit 
 */
export async function fetchNearbyPlaces(lat, lng, category, limit = 10) {
  try {
    const res = await api(`/map/places?lat=${lat}&lng=${lng}&category=${category}&limit=${limit}`);
    return res.data;
  } catch (error) {
    console.error('fetchNearbyPlaces error:', error);
    return null;
  }
}

/**
 * Get route from ORS
 * @param {Array<number>} start [lng, lat]
 * @param {Array<number>} end [lng, lat]
 */
export async function fetchRoute(start, end) {
  try {
    const res = await api('/map/route', {
      method: 'POST',
      body: { start, end },
    });
    return res.data;
  } catch (error) {
    console.error('fetchRoute error:', error);
    return null;
  }
}

/**
 * Get safety score based on nearby emergency services
 * @param {number} lat 
 * @param {number} lng 
 */
export async function fetchSafetyScore(lat, lng) {
  try {
    const res = await api(`/map/safety-score?lat=${lat}&lng=${lng}`);
    return res.data;
  } catch (error) {
    console.error('fetchSafetyScore error:', error);
    return null;
  }
}
