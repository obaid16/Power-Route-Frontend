import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { formatCurrency, formatDistance } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

export function ChargingStationCard({ station, onPress, variant = 'compact', selected = false, style }) {
  if (variant === 'featured') {
    return <FeaturedStationCard station={station} onPress={onPress} selected={selected} style={style} />;
  }
  return <CompactStationCard station={station} onPress={onPress} selected={selected} style={style} />;
}

function CompactStationCard({ station, onPress, selected, style }) {
  const { scaleFont, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: C } = useTheme();
  const padding = isLargeScreen ? 18 : isTablet ? 16 : 14;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactWrap, 
        { 
          padding, 
          backgroundColor: isDark ? C.bgElevated : '#fff', 
          borderColor: selected ? C.accentCyan : C.borderSoft 
        }, 
        pressed && styles.pressed, 
        style
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={{ flex: 1, paddingRight: 8, color: C.text, fontSize: scaleFont(isLargeScreen ? 18 : 16), fontWeight: '600' }} numberOfLines={1}>
          {station.name}
        </Text>
        <View style={[styles.kwPill, { backgroundColor: `${C.accentCyan}15` }]}>
          <Ionicons name="flash" size={scaleFont(14)} color={C.accentCyan} />
          <Text style={{ color: C.accentCyan, marginLeft: 2, fontSize: scaleFont(12), fontWeight: '600' }}>
            {station.maxKw} kW
          </Text>
        </View>
      </View>
      
      <Text numberOfLines={1} style={{ color: C.textFaint, marginTop: 4, fontSize: scaleFont(isLargeScreen ? 14 : 12) }}>
        {station.address}
      </Text>
      
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <View style={styles.metaGroup}>
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={scaleFont(14)} color={C.textMuted} />
            <Text style={{ color: C.textMuted, marginLeft: 4, fontSize: scaleFont(12) }}>
              {formatDistance(station.distanceKm)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={scaleFont(14)} color={C.warning} />
            <Text style={{ color: C.textMuted, marginLeft: 4, fontSize: scaleFont(12) }}>
              {station.rating}
            </Text>
          </View>
        </View>
        <Text style={{ color: C.success || '#10b981', fontSize: scaleFont(12), fontWeight: '500' }}>
          {station.availablePorts}/{station.totalPorts} free
        </Text>
      </View>
    </Pressable>
  );
}

function FeaturedStationCard({ station, onPress, selected, style }) {
  const { featuredCardWidth, scaleFont, isDesktop, isLargeScreen } = useResponsive();
  const { isDark, colors: C } = useTheme();
  
  const totalPorts = Math.max(1, station.totalPorts || 1);
  const availability = Math.min(1, (station.availablePorts || 0) / totalPorts);
  const network = station.network ?? 'Network';
  const price = station.pricePerKwh ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featPress,
        { width: style?.width === '100%' ? '100%' : featuredCardWidth },
        isDesktop && { marginRight: 0, width: '100%' },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[
        styles.featCard, 
        { 
          backgroundColor: isDark ? C.bgElevated : '#fff',
          borderColor: selected ? C.accentCyan : C.borderSoft,
          padding: isLargeScreen ? 20 : 16
        }
      ]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.networkText, { color: C.accentCyan, fontSize: scaleFont(10) }]} numberOfLines={1}>
            {network}
          </Text>
          <View style={[styles.featKwPill, { backgroundColor: `${C.accentCyan}12`, borderColor: `${C.accentCyan}25` }]}>
            <Ionicons name="flash" size={scaleFont(13)} color={C.accentCyan} />
            <Text style={{ color: C.accentCyan, fontSize: scaleFont(11), fontWeight: '700', marginLeft: 4 }}>
              {station.maxKw} kW
            </Text>
          </View>
        </View>
        
        <Text style={[styles.featTitle, { color: C.text, fontSize: scaleFont(isLargeScreen ? 20 : 18) }]} numberOfLines={2}>
          {station.name}
        </Text>
        <Text style={[styles.featAddress, { color: C.textFaint, fontSize: scaleFont(isLargeScreen ? 14 : 12) }]} numberOfLines={1}>
          {station.address}
        </Text>
        
        <View style={styles.featMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={scaleFont(14)} color={C.textMuted} />
            <Text style={[styles.metaText, { color: C.textMuted, fontSize: scaleFont(12) }]}>
              {formatDistance(station.distanceKm)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={scaleFont(14)} color={C.warning} />
            <Text style={[styles.metaText, { color: C.textMuted, fontSize: scaleFont(12) }]}>
              {station.rating}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={scaleFont(14)} color={C.textMuted} />
            <Text style={[styles.metaText, { color: C.textMuted, fontSize: scaleFont(12) }]}>
              {formatCurrency(price)}/kWh
            </Text>
          </View>
        </View>
        
        <View style={styles.featFooter}>
          <View style={[styles.portTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[styles.portFill, { width: `${Math.round(availability * 100)}%`, backgroundColor: C.accentCyan }]} />
          </View>
          <Text style={{ marginTop: 8, color: C.success || '#10b981', fontSize: scaleFont(11), fontWeight: '600' }}>
            {station.availablePorts}/{station.totalPorts} ports live
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaGroup:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pressed:    { transform: [{ translateY: -2 }], opacity: 0.9 },
  
  // Compact
  compactWrap: {
    flex: 1, minWidth: 0,
    borderRadius: 16, borderWidth: 1,
    marginRight: 12,
  },
  kwPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  
  // Featured
  featPress: { marginRight: 14, maxWidth: '100%' },
  featCard: {
    borderRadius: 20, borderWidth: 1,
  },
  networkText: { flex: 1, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  featKwPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  featTitle:   { marginTop: 10, fontWeight: '700', letterSpacing: -0.3 },
  featAddress: { marginTop: 6 },
  featMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 16 },
  metaText:    { fontWeight: '500' },
  featFooter:  { marginTop: 16 },
  portTrack:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  portFill:    { height: '100%', borderRadius: 3 },
});
