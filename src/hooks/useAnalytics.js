import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/apiClient';
import { buildEnergyWeek, mapBookingHistory } from '../utils/mappers';

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ecoScore, setEcoScore] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [energyWeek, setEnergyWeek] = useState([]);
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eco, costs, hist] = await Promise.all([
        api('/analytics/eco-score'),
        api('/analytics/costs'),
        api('/analytics/charging-history'),
      ]);
      setEcoScore(eco.data?.ecoScore ?? 0);
      setMonthlySpend(costs.data?.costs?.estimatedTotalCost ?? 0);
      const raw = hist.data?.history || [];
      setHistory(mapBookingHistory(raw));
      setEnergyWeek(buildEnergyWeek(raw));
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, ecoScore, monthlySpend, energyWeek, history, reload: load };
}
