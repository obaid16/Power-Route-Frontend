/**
 * NotificationsScreen — PowerRoute
 *
 * Displays smart real-time notifications:
 * - Low / critical battery warnings
 * - Charging station availability
 * - Traffic alerts
 * - Route change suggestions
 * - Nearby emergency services
 */
import { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, GlassCard } from '../components';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

// ── Notification types ────────────────────────────────────────────────────────
const TYPE_META = {
  battery_low:      { icon: 'battery-half',    color: '#fbbf24', label: 'Battery Warning'   },
  battery_critical: { icon: 'battery-dead',    color: '#ef4444', label: 'Critical Battery'  },
  station_avail:    { icon: 'flash',            color: '#00D97E', label: 'Station Available' },
  traffic:          { icon: 'car',              color: '#f97316', label: 'Traffic Alert'     },
  route_change:     { icon: 'navigate',         color: '#a855f7', label: 'Route Update'      },
  emergency:        { icon: 'warning',          color: '#ef4444', label: 'Emergency Nearby'  },
  charging_done:    { icon: 'checkmark-circle', color: '#22c55e', label: 'Charging Complete' },
};

// Generate smart notifications based on vehicle state
function buildNotifications(vehicle, stations) {
  const notes = [];
  const now = Date.now();

  if (vehicle?.batteryPct > 0 && vehicle.batteryPct <= 15) {
    notes.push({
      id: 'n-crit',
      type: 'battery_critical',
      title: 'Critical battery level',
      body: `Pack at ${vehicle.batteryPct}% — find a charger immediately.`,
      time: now - 60000,
      read: false,
    });
  } else if (vehicle?.batteryPct > 0 && vehicle.batteryPct <= 30) {
    notes.push({
      id: 'n-low',
      type: 'battery_low',
      title: 'Low battery warning',
      body: `Pack at ${vehicle.batteryPct}% — ${vehicle.rangeKm} km estimated range remaining.`,
      time: now - 120000,
      read: false,
    });
  }

  const openStation = stations.find((s) => s.availablePorts > 0);
  if (openStation) {
    notes.push({
      id: 'n-station',
      type: 'station_avail',
      title: 'Charging port available',
      body: `${openStation.name} has ${openStation.availablePorts} open port${openStation.availablePorts > 1 ? 's' : ''} · ${openStation.distanceKm} km away.`,
      time: now - 300000,
      read: false,
    });
  }

  // Static demo notifications
  notes.push(
    {
      id: 'n-traffic',
      type: 'traffic',
      title: 'Heavy traffic ahead',
      body: 'Congestion detected on your route — ETA increased by ~8 min. Alternative route available.',
      time: now - 600000,
      read: true,
    },
    {
      id: 'n-route',
      type: 'route_change',
      title: 'Route optimised',
      body: 'AI rerouted via Highway 48 to save 12% battery and 6 minutes.',
      time: now - 900000,
      read: true,
    },
    {
      id: 'n-emergency',
      type: 'emergency',
      title: 'Emergency services nearby',
      body: 'City Hospital is 1.2 km from your current location.',
      time: now - 1800000,
      read: true,
    },
  );

  return notes.sort((a, b) => b.time - a.time);
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { vehicle, stations } = useVoltApi();
  const { contentContainerStyle, scaleFont, isLargeScreen } = useResponsive();
  const { colors, isDark } = useTheme();

  const [notifications, setNotifications] = useState(() =>
    buildNotifications(vehicle, stations)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markAsRead = (id) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentContainerStyle, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: scaleFont(26), fontWeight: '900', letterSpacing: -0.6, color: colors.accentCyan }}>
              PowerRoute
            </Text>
            <Text style={{ marginTop: 2, fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 24 : 20) }}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: scaleFont(13) }}>
                {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllRead}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(0,217,126,0.08)' : 'rgba(0,106,78,0.08)',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: colors.accentCyan, fontSize: scaleFont(12), fontWeight: '600' }}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Empty state */}
        {notifications.length === 0 && (
          <GlassCard padding={24}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(14), textAlign: 'center' }}>
                No notifications yet. Drive safe!
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Notification list */}
        <View style={{ gap: 10 }}>
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.station_avail;
            return (
              <Pressable
                key={n.id}
                onPress={() => markAsRead(n.id)}
                style={({ pressed }) => ({
                  borderRadius: 16, borderWidth: 1,
                  borderColor: n.read ? colors.borderSoft : `${meta.color}40`,
                  backgroundColor: n.read
                    ? isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.7)'
                    : `${meta.color}10`,
                  padding: isLargeScreen ? 18 : 14,
                  flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                {/* Icon */}
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: `${meta.color}20`,
                  borderWidth: 1, borderColor: `${meta.color}40`,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: `${meta.color}20` }}>
                      <Text style={{ fontSize: scaleFont(9), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: meta.color }}>
                        {meta.label}
                      </Text>
                    </View>
                    {!n.read ? (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: meta.color }}>
                        <Text style={{ fontSize: scaleFont(9), fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>UNREAD</Text>
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                        <Text style={{ fontSize: scaleFont(9), fontWeight: '800', color: colors.textFaint, textTransform: 'uppercase' }}>READ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(isLargeScreen ? 15 : 14) }}>
                    {n.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12), marginTop: 4, lineHeight: 18 }}>
                    {n.body}
                  </Text>
                  <Text style={{ color: colors.textFaint, fontSize: scaleFont(11), marginTop: 6 }}>
                    {timeAgo(n.time)}
                  </Text>
                </View>

                {/* Dismiss */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    dismiss(n.id);
                  }}
                  hitSlop={10}
                  accessibilityLabel="Dismiss notification"
                  style={{ zIndex: 10, padding: 4 }}
                >
                  <Ionicons name="close" size={16} color={colors.textFaint} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}
