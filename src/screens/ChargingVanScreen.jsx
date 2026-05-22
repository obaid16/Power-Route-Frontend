import { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassCard, ThemeToggle } from '../components';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/apiClient';

export function ChargingVanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { contentContainerStyle, scaleFont, isLargeScreen, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentContainerStyle, { paddingTop: insets.top + 16, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nav Bar (ELECTRA) ───────────────────────── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1, borderRadius: 999,
          paddingHorizontal: 16, paddingVertical: 10,
          marginBottom: 24,
          backgroundColor: isDark ? '#060810' : '#ffffff', borderColor: colors.borderSoft,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
        }}>
          {/* Brand */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6' }}>
              <Ionicons name="flash" size={14} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 0.5, color: colors.text }}>
              ELECTRA
            </Text>
          </View>
          {/* Links */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
            {[
              { label: 'Home',     active: false, onPress: () => navigation.navigate('HomeDashboard') },
              { label: 'Map',      active: false, onPress: () => navigation.navigate('Map') },
              { label: 'Vehicles', active: true,  onPress: () => {} },
              { label: 'Safety',   active: false, onPress: () => navigation.navigate('WomenSafety') },
              { label: 'SOS',      active: false, onPress: () => navigation.navigate('EmergencySOS') },
            ].map(({ label, active, onPress }) => (
              <Pressable key={label} onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', height: 32 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: active ? '#a855f7' : colors.textMuted }}>
                  {label}
                </Text>
                {active && <View style={{ position: 'absolute', bottom: -4, width: '100%', height: 2, borderRadius: 2, backgroundColor: '#a855f7' }} />}
              </Pressable>
            ))}
          </View>
          {/* Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Ionicons name="notifications" size={18} color={colors.textMuted} />
            <ThemeToggle size="sm" showLabel={false} />
            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Image source={{ uri: 'https://i.pravatar.cc/100?img=47' }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            </View>
          </View>
        </View>

        {/* ── Main Content Grid ───────────────────────── */}
        <View style={{ flexDirection: isLargeScreen ? 'row' : 'column', gap: 20 }}>
          
          {/* Left Panel: My Van */}
          <View style={{
            flex: 1, backgroundColor: isDark ? '#10121d' : '#f8fafc',
            borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
            padding: 24, position: 'relative', overflow: 'hidden'
          }}>
            <Text style={{ color: colors.textMuted, fontSize: scaleFont(13), fontWeight: '600' }}>My Van</Text>
            <Text style={{ color: colors.text, fontSize: scaleFont(22), fontWeight: '700', marginTop: 4 }}>Electra Van</Text>
            
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
              backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start'
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
              <Text style={{ color: '#10b981', fontSize: scaleFont(11), fontWeight: '700' }}>Ready to Drive</Text>
            </View>
            
            <View style={{ width: '100%', height: 200, marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
               <Image source={require('../../assets/van.png')} style={{ width: '110%', height: '110%', resizeMode: 'contain' }} />
            </View>
            
            {/* Battery & Range row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Battery</Text>
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Range</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: scaleFont(16), fontWeight: '700' }}>80%</Text>
                <View style={{ height: 6, flex: 1, backgroundColor: colors.borderSoft, borderRadius: 3, overflow: 'hidden', marginRight: 20 }}>
                  <View style={{ width: '80%', height: '100%', backgroundColor: '#10b981', borderRadius: 3 }} />
                </View>
              </View>
              <Text style={{ color: colors.text, fontSize: scaleFont(16), fontWeight: '700' }}>260 km</Text>
            </View>
          </View>

          {/* Right Panel: Overview */}
          <View style={{
            flex: 1.2, backgroundColor: isDark ? '#10121d' : '#f8fafc',
            borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
            padding: 24,
          }}>
            <Text style={{ color: colors.text, fontSize: scaleFont(18), fontWeight: '700', marginBottom: 20 }}>Van Overview</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {/* Box 1 */}
              <View style={{
                flex: 1, minWidth: '45%', backgroundColor: isDark ? '#16192b' : '#ffffff',
                borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.borderSoft
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Total Distance</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: scaleFont(22), fontWeight: '700' }}>1,256 <Text style={{ fontSize: scaleFont(14), color: colors.textMuted, fontWeight: '500' }}>km</Text></Text>
              </View>

              {/* Box 2 */}
              <View style={{
                flex: 1, minWidth: '45%', backgroundColor: isDark ? '#16192b' : '#ffffff',
                borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.borderSoft
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Ionicons name="scan-outline" size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Total Trips</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: scaleFont(22), fontWeight: '700' }}>28</Text>
              </View>

              {/* Box 3 */}
              <View style={{
                flex: 1, minWidth: '45%', backgroundColor: isDark ? '#16192b' : '#ffffff',
                borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.borderSoft
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Ionicons name="flash-outline" size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Total Energy</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: scaleFont(22), fontWeight: '700' }}>320 <Text style={{ fontSize: scaleFont(14), color: colors.textMuted, fontWeight: '500' }}>kWh</Text></Text>
              </View>

              {/* Box 4 */}
              <View style={{
                flex: 1, minWidth: '45%', backgroundColor: isDark ? '#16192b' : '#ffffff',
                borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.borderSoft
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }}>Total Cost</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: scaleFont(22), fontWeight: '700' }}>₹1,890</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ───────────────────────── */}
        <View style={{
          marginTop: 20, backgroundColor: isDark ? '#10121d' : '#f8fafc',
          borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
          padding: 24,
        }}>
          <Text style={{ color: colors.text, fontSize: scaleFont(16), fontWeight: '700', marginBottom: 20 }}>Quick Actions</Text>
          
          <View style={{ flexDirection: isLargeScreen ? 'row' : 'column', gap: 16, justifyContent: 'space-between' }}>
            {[
              { icon: 'location-outline', label: 'Location Tracking' },
              { icon: 'time-outline', label: 'Trip History' },
              { icon: 'build-outline', label: 'Maintenance' },
              { icon: 'settings-outline', label: 'Settings' },
            ].map(act => (
              <Pressable key={act.label} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                backgroundColor: isDark ? '#16192b' : '#ffffff', borderRadius: 10, paddingVertical: 14,
                borderWidth: 1, borderColor: colors.borderSoft
              }}>
                <Ionicons name={act.icon} size={18} color="#a855f7" />
                <Text style={{ color: colors.text, fontSize: scaleFont(13), fontWeight: '600' }}>{act.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </ScreenBackground>
  );
}
