/**
 * NearbyServicesScreen — PowerRoute
 *
 * Displays nearby essential services:
 * Hotels · Hospitals · Police · EV Stations · Repair Centers · Restaurants
 *
 * Uses dummy data when backend is unavailable; real data flows from
 * /stations/nearby and can be extended with a Google Places API call.
 */
import { useState, useMemo, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, GlassCard } from '../components';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/apiClient';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',      label: 'All',        icon: 'apps-outline' },
  { id: 'charging', label: 'Charging',   icon: 'flash-outline' },
  { id: 'hospital', label: 'Hospital',   icon: 'medkit-outline' },
  { id: 'police',   label: 'Police',     icon: 'shield-outline' },
  { id: 'hotel',    label: 'Hotels',     icon: 'bed-outline' },
  { id: 'repair',   label: 'Repair',     icon: 'construct-outline' },
  { id: 'food',     label: 'Food',       icon: 'restaurant-outline' },
];


const CATEGORY_COLORS = {
  charging: '#00D97E',
  hospital: '#ef4444',
  police:   '#3b82f6',
  hotel:    '#a855f7',
  repair:   '#f97316',
  food:     '#22c55e',
  all:      '#94a3b8',
};

export function NearbyServicesScreen() {
  const insets = useSafeAreaInsets();
  const { stations, loading: stationsLoading } = useVoltApi();
  const { contentContainerStyle, scaleFont, isLargeScreen, isTablet, horizontalPadding } = useResponsive();
  const { colors, isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');

  const [dbServices, setDbServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Fetch essential services from MongoDB backend on mount
  useEffect(() => {
    let active = true;
    async function fetchServices() {
      try {
        setServicesLoading(true);
        const res = await api('/services/nearby');
        if (!active) return;
        setDbServices(res?.data?.services || []);
      } catch (err) {
        console.error('Failed to fetch nearby services:', err);
      } finally {
        if (active) setServicesLoading(false);
      }
    }
    fetchServices();
    return () => {
      active = false;
    };
  }, []);

  // Map stations from API into service items
  const stationServices = useMemo(() =>
    stations.map((s) => ({
      id: s.id,
      category: 'charging',
      name: s.name,
      distance: `${s.distanceKm} km`,
      phone: null,
      address: s.address,
      open: s.availablePorts > 0,
      extra: `${s.availablePorts}/${s.totalPorts} ports · ${s.maxKw} kW`,
    })),
  [stations]);

  const allServices = useMemo(() => {
    const mappedDb = dbServices.map((s) => ({
      id: s._id,
      category: s.category,
      name: s.name,
      distance: s.distance,
      phone: s.phone,
      address: s.address,
      open: s.open,
    }));
    return [...stationServices, ...mappedDb];
  }, [stationServices, dbServices]);

  const loading = stationsLoading || servicesLoading;

  const filtered = activeCategory === 'all'
    ? allServices
    : allServices.filter((s) => s.category === activeCategory);

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentContainerStyle, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ fontSize: scaleFont(26), fontWeight: '900', letterSpacing: -0.6, color: colors.accentCyan }}>
          PowerRoute
        </Text>
        <Text style={{ marginTop: 2, fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 24 : 20) }}>
          Nearby Services
        </Text>
        <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: scaleFont(14), fontWeight: '600', marginBottom: 20 }}>
          Hotels · Hospitals · Police · Charging · Repair · Food
        </Text>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 20, marginHorizontal: -horizontalPadding }}
          contentInset={{ left: horizontalPadding, right: horizontalPadding }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const catColor = CATEGORY_COLORS[cat.id] ?? colors.accentCyan;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? catColor : colors.borderSoft,
                  backgroundColor: active
                    ? `${catColor}20`
                    : isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)',
                }}
              >
                <Ionicons name={cat.icon} size={14} color={active ? catColor : colors.textMuted} />
                <Text style={{ fontSize: scaleFont(12), fontWeight: '600', color: active ? catColor : colors.textMuted }}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator color={colors.accentCyan} />
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: scaleFont(13) }}>Loading nearby services…</Text>
          </View>
        )}

        {/* Service cards */}
        {filtered.length === 0 && !loading ? (
          <GlassCard padding={20}>
            <Text style={{ color: colors.textMuted, fontSize: scaleFont(14), textAlign: 'center' }}>
              No services found in this category nearby.
            </Text>
          </GlassCard>
        ) : (
          <View style={isTablet || isLargeScreen ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 10 }}>
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                colors={colors}
                isDark={isDark}
                scaleFont={scaleFont}
                isLargeScreen={isLargeScreen}
                isTablet={isTablet}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function ServiceCard({ service, colors, isDark, scaleFont, isLargeScreen, isTablet }) {
  const catColor = CATEGORY_COLORS[service.category] ?? colors.accentCyan;
  const iconMap = {
    charging: 'flash',
    hospital: 'medkit',
    police:   'shield',
    hotel:    'bed',
    repair:   'construct',
    food:     'restaurant',
  };
  const icon = iconMap[service.category] ?? 'location';

  return (
    <View style={[
      {
        borderRadius: 16, borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.85)',
        padding: isLargeScreen ? 18 : 14,
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      },
      (isTablet || isLargeScreen) && { flexBasis: '48%', flexGrow: 1 },
    ]}>
      {/* Icon */}
      <View style={{
        width: isLargeScreen ? 46 : 40, height: isLargeScreen ? 46 : 40,
        borderRadius: isLargeScreen ? 23 : 20,
        backgroundColor: `${catColor}18`,
        borderWidth: 1, borderColor: `${catColor}35`,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={icon} size={isLargeScreen ? 22 : 18} color={catColor} />
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(isLargeScreen ? 15 : 14), flex: 1 }} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
            backgroundColor: service.open ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)',
            borderWidth: 1, borderColor: service.open ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.3)',
          }}>
            <Text style={{ fontSize: scaleFont(10), fontWeight: '700', color: service.open ? colors.accentMint : colors.danger }}>
              {service.open ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 3 }} numberOfLines={1}>
          {service.address}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={12} color={catColor} />
            <Text style={{ color: catColor, fontSize: scaleFont(12), fontWeight: '600' }}>{service.distance}</Text>
          </View>
          {service.extra && (
            <Text style={{ color: colors.textFaint, fontSize: scaleFont(11) }}>{service.extra}</Text>
          )}
          {service.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${service.phone}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="call" size={12} color={colors.accentCyan} />
              <Text style={{ color: colors.accentCyan, fontSize: scaleFont(12), fontWeight: '600' }}>{service.phone}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
