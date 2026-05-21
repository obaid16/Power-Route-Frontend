import { api } from './apiClient';
import { mapStationFromApi } from '../utils/mappers';

export async function fetchStationById(id) {
  const res = await api(`/stations/${id}`, { auth: false });
  return mapStationFromApi(res.data.station);
}
