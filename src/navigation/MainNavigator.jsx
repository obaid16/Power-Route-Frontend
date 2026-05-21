import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingAIButton } from '../components';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { HomeDashboardScreen } from '../screens/HomeDashboardScreen';
import { LiveMapScreen } from '../screens/LiveMapScreen';
import { AnalyticsDashboardScreen } from '../screens/AnalyticsDashboardScreen';
import { StationDetailsScreen } from '../screens/StationDetailsScreen';
import { AIRecommendationScreen } from '../screens/AIRecommendationScreen';
import { EmergencySOSScreen } from '../screens/EmergencySOSScreen';
import { NearbyServicesScreen } from '../screens/NearbyServicesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ChargingVanScreen } from '../screens/ChargingVanScreen';
import { VoltPathShieldScreen } from '../screens/VoltPathShieldScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** Wraps icon + optional glowing active-dot indicator */
function TabIcon({ name, focused, focusedName, color, size, accentColor }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 2 }}>
      <Ionicons name={focused ? focusedName : name} size={focused ? size + 1 : size} color={color} />
      {focused && (
        <View style={{
          marginTop: 5,
          width: 20, height: 3, borderRadius: 2,
          backgroundColor: accentColor,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 4,
        }} />
      )}
    </View>
  );
}

/** Premium gradient hairline rendered above the tab bar */
function TabBarTopBorder() {
  return (
    <LinearGradient
      colors={['#00D97E', '#34d399', '#a855f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
      pointerEvents="none"
    />
  );
}

export function MainTabsScreen() {
  const navigation = useNavigation();
  const { tabBarHeight, fabSize, fabBottomOffset, scaleFont, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const stackNav = navigation;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 0,
            height: tabBarHeight + 6,
            paddingBottom: isTablet ? 14 : 12,
            paddingTop: 10,
            overflow: 'hidden',
          },
          tabBarActiveTintColor: colors.accentCyan,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarLabelStyle: {
            fontSize: scaleFont(11),
            fontWeight: '600',
            letterSpacing: 0.5,
            marginTop: -2,
          },
          tabBarBackground: () => <TabBarTopBorder />,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeDashboardScreen}
          options={{
            tabBarLabel: 'Pulse',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="pulse-outline" focusedName="pulse" focused={focused} color={color} size={22} accentColor={colors.accentCyan} />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          component={LiveMapScreen}
          options={{
            tabBarLabel: 'Live Map',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="map-outline" focusedName="map" focused={focused} color={color} size={22} accentColor={colors.accentCyan} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsDashboardScreen}
          options={{
            tabBarLabel: 'Insights',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="stats-chart-outline" focusedName="stats-chart" focused={focused} color={color} size={22} accentColor={colors.accentCyan} />
            ),
          }}
        />
        <Tab.Screen
          name="VoltPathShield"
          component={VoltPathShieldScreen}
          options={{
            tabBarLabel: ({ focused }) => (
              <Text style={{ color: focused ? '#ef4444' : 'rgba(239, 68, 68, 0.7)', fontWeight: '800', fontSize: scaleFont(11), textAlign: 'center', letterSpacing: 0.5, marginTop: -2 }}>
                Women Safety
              </Text>
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon name="shield-checkmark-outline" focusedName="shield-checkmark" focused={focused} color={focused ? '#ef4444' : 'rgba(239, 68, 68, 0.7)'} size={23} accentColor="#ef4444" />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingAIButton
        onPress={() => stackNav.navigate('AIRecommend')}
        bottomOffset={fabBottomOffset}
        size={fabSize}
        icon="sparkles"
        caption="Volt AI"
      />
    </View>
  );
}

export function MainNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabsScreen} />
      <Stack.Screen
        name="StationDetails"
        component={StationDetailsScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: colors.accentCyan,
        }}
      />
      <Stack.Screen
        name="AIRecommend"
        component={AIRecommendationScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="NearbyServices"
        component={NearbyServicesScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'Nearby Services',
          headerTintColor: colors.accentCyan,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'Notifications',
          headerTintColor: colors.accentCyan,
        }}
      />
      <Stack.Screen
        name="ChargingVan"
        component={ChargingVanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WomenSafety"
        component={VoltPathShieldScreen}
        options={{ headerShown: false }}
      />

      <Stack.Group
        screenOptions={{
          presentation: 'fullScreenModal',
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

