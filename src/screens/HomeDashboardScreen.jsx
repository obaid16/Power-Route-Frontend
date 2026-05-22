import React, { useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenBackground, Footer } from "../components";
import { useMainStackNav } from "../hooks/useMainStackNav";
import { useResponsive } from "../hooks/useResponsive";
import { useAuth } from "../context/AuthContext";
import { useVoltApi } from "../hooks/useVoltApi";
import { useTheme } from "../context/ThemeContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function HomeDashboardScreen() {
  const navigation = useNavigation();
  const stackNav = useMainStackNav();
  const { user } = useAuth();
  const { colors: C, isDark } = useTheme();
  const { contentContainerStyle, isTablet, isLargeScreen, isMobile } =
    useResponsive();

  const { loading, vehicle, stations } = useVoltApi();

  const sosPulse = useSharedValue(1);
  useEffect(() => {
    sosPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [sosPulse]);

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          contentContainerStyle,
          { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nav Bar ───────────────────────── */}
        <View style={styles.navBar}>
          <View style={styles.navBrand}>
            <View style={styles.navLogoElectra}>
              <Ionicons name="flash" size={14} color="#ffffff" />
            </View>
            <Text style={styles.navBrandText}>ELECTRA</Text>
          </View>

          {!(isMobile && !isTablet) && (
            <View style={styles.navLinks}>
              <Pressable style={styles.navLinkContainer}>
                <Text style={styles.navLinkActive}>Home</Text>
                <View style={styles.navLinkActiveBar} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Map")}>
                <Text style={styles.navLinkInactive}>Map</Text>
              </Pressable>
              <Pressable onPress={() => stackNav.navigate("ChargingVan")}>
<<<<<<< HEAD
                <Text style={styles.navLinkInactive}>Van</Text>
=======
                <Text style={styles.navLinkInactive}>Vehicles</Text>
>>>>>>> 908091840af87b304a3fa5e1c15ad3a7fe4bcfb4
              </Pressable>
              <Pressable onPress={() => navigation.navigate("VoltPathShield")}>
                <Text style={styles.navLinkInactive}>Safety</Text>
              </Pressable>
              <Pressable onPress={() => stackNav.navigate("EmergencySOS")}>
                <Text style={styles.navLinkInactive}>SOS</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.navActions}>
            <Pressable onPress={() => stackNav.navigate("Notifications")}>
              <Ionicons name="notifications" size={18} color="#a1a1aa" />
            </Pressable>
            <Pressable>
              <Ionicons name="moon" size={18} color="#a1a1aa" />
            </Pressable>
            <Pressable 
              style={styles.avatarWrap}
              onPress={() => Alert.alert("Profile", "Profile screen coming soon!")}
            >
              <Image
                source={{ uri: "https://i.pravatar.cc/100?img=47" }}
                style={styles.avatarImg}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Main Grid Layout ───────────────────────── */}
        <View style={styles.grid}>
          {/* Card 1: My Vehicle */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>My Vehicle</Text>
              <Ionicons name="chevron-down" size={16} color="#a1a1aa" />
            </View>
            <Text style={styles.vehicleName}>
              {vehicle?.evVehicleModel || "MG 4 Luxury"}
            </Text>

            <View style={styles.carImgWrap}>
              <Image
                source={require("../../assets/cyber_car.png")}
                style={styles.carImg}
              />
            </View>

            <View style={styles.vehicleFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.footerLabel}>Charging</Text>
                <View style={styles.chargingTrack}>
                  <View
                    style={[
                      styles.chargingFill,
                      {
                        width: `${vehicle?.batteryPct > 0 ? vehicle.batteryPct : 60}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={{ alignItems: "flex-end", marginLeft: 16 }}>
                <Text style={styles.footerLabel}>Range</Text>
                <Text style={styles.footerValue}>
                  {vehicle?.rangeKm > 0 ? vehicle.rangeKm : "215.6"} km
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Battery Status */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Battery Status</Text>
              <Ionicons name="ellipsis-horizontal" size={16} color="#a1a1aa" />
            </View>
            <View style={styles.batteryCenter}>
              {/* circular progress mock */}
              <View style={styles.batteryCircleTrack}>
                <View style={styles.batteryCircleFill} />
                <View style={styles.batteryCircleInner}>
                  <Text style={styles.batteryPct}>
                    {vehicle?.batteryPct > 0 ? vehicle.batteryPct : 60}%
                  </Text>
                </View>
              </View>
              <Text style={styles.batteryStatusTxt}>⚡ Charging</Text>
            </View>
            <View style={{ alignItems: "flex-end", marginTop: "auto" }}>
              <Text style={styles.footerLabel}>Range</Text>
              <Text style={styles.footerValue}>
                {vehicle?.rangeKm > 0 ? vehicle.rangeKm : "215.6"} km
              </Text>
            </View>
          </View>

          {/* Card 3: Nearby Stations */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Nearby Stations</Text>
              <Ionicons name="chevron-down" size={16} color="#a1a1aa" />
            </View>
            <View style={styles.mapArea}>
              {/* Abstract map elements */}
              <View
                style={[
                  styles.mapLine,
                  { transform: [{ rotate: "15deg" }], top: 40, left: -20 },
                ]}
              />
              <View
                style={[
                  styles.mapLine,
                  { transform: [{ rotate: "-30deg" }], top: 80, left: 20 },
                ]}
              />
              <View style={[styles.mapPin, { top: 30, left: "30%" }]}>
                <Ionicons name="location" size={12} color="#ffffff" />
              </View>
              <View style={[styles.mapPinLg, { top: 20, right: "20%" }]}>
                <View style={styles.mapPinLgInner} />
              </View>

              <View style={styles.stationOverlay}>
                <Text style={styles.stationName}>Electra Station</Text>
                <View style={styles.stationRow}>
                  <Text style={styles.stationLabel}>Range</Text>
                  <Text style={styles.stationValue}>0.8 km</Text>
                </View>
                <View style={styles.stationRow}>
                  <Text style={styles.stationLabel}>Available</Text>
                  <Text style={styles.stationValue}>4/6</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 4: Recent Trips */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Trips</Text>
            </View>
            <View style={styles.tripList}>
              <TripItem
                icon="location"
                title="Home"
                dist="12.3 km"
                time="Today, 08:30 AM"
                color="#9333ea"
              />
              <TripItem
                icon="business"
                title="Office"
                dist="24.6 km"
                time="Yesterday, 06:20 PM"
                color="#c084fc"
              />
              <TripItem
                icon="cart"
                title="Mall"
                dist="18.7 km"
                time="May 10, 05:40 PM"
                color="#d8b4fe"
              />
            </View>
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllTxt}>View All</Text>
            </Pressable>
          </View>

          {/* Card 5: Quick Actions */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionList}>
              <ActionBtn
                icon="search-outline"
                label="Find Station"
                onPress={() => navigation.navigate("Map")}
              />
              <ActionBtn icon="wallet-outline" label="Charge History" />
              <ActionBtn icon="car-outline" label="Vehicle Status" />
              <ActionBtn icon="navigate-outline" label="Navigation" />
            </View>
          </View>

          {/* Card 6: Cost Overview */}
          <View
            style={[
              styles.card,
              styles.gridItem,
              { flexBasis: isLargeScreen ? "32%" : isTablet ? "48%" : "100%" },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Cost Overview</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>This Month</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", marginBottom: 12 }}>
              <Text style={styles.costTotal}>₹1,245</Text>
              <Text style={styles.costLabel}>Total Spend</Text>
            </View>

            <View style={styles.chartWrap}>
              <View style={styles.chartYAxis}>
                <Text style={styles.chartAxisLabel}>2K</Text>
                <Text style={styles.chartAxisLabel}>1.5K</Text>
                <Text style={styles.chartAxisLabel}>1K</Text>
                <Text style={styles.chartAxisLabel}>500</Text>
              </View>
              <View style={styles.chartBars}>
                {/* Simulated Bar Chart */}
                {[30, 70, 20, 90, 40, 80, 50, 100, 30].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      {
                        height: `${h}%`,
                        backgroundColor: i % 2 === 0 ? "#9333ea" : "#c084fc",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.chartXAxis}>
              <Text style={styles.chartAxisLabel}>May 1</Text>
              <Text style={styles.chartAxisLabel}>May 10</Text>
              <Text style={styles.chartAxisLabel}>May 20</Text>
              <Text style={styles.chartAxisLabel}>May 30</Text>
            </View>
          </View>
          {/* ── Footer ───────────────────────────── */}
          <Footer />
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TripItem({ icon, title, dist, time, color }) {
  return (
    <View style={styles.tripItem}>
      <View
        style={[
          styles.tripIconBox,
          { backgroundColor: "rgba(168, 85, 247, 0.1)" },
        ]}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tripTitle}>{title}</Text>
        <Text style={styles.tripSub}>{dist}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.tripTime}>{time}</Text>
        <Text style={styles.tripDist}>{dist}</Text>
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icon} size={20} color="#c084fc" />
      <Text style={styles.actionBtnTxt}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {},

  // Navbar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 24,
  },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLogoElectra: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
  },
  navBrandText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#ffffff",
  },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 32 },
  navLinkContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 32,
  },
  navLinkInactive: { fontWeight: "600", fontSize: 14, color: "#a1a1aa" },
  navLinkActive: { fontWeight: "700", fontSize: 14, color: "#d8b4fe" },
  navLinkActiveBar: {
    position: "absolute",
    bottom: -4,
    width: "100%",
    height: 2,
    borderRadius: 2,
    backgroundColor: "#d8b4fe",
  },
  navActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  gridItem: { minWidth: 280 },

  // Cards
  card: {
    backgroundColor: "#161421",
    borderRadius: 20,
    padding: 20,
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#1f1c2c",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { color: "#ffffff", fontSize: 16, fontWeight: "600" },

  // Vehicle Card
  vehicleName: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  carImgWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 120,
  },
  carImg: { width: "100%", height: 120, resizeMode: "contain" },
  vehicleFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
  },
  footerLabel: { color: "#a1a1aa", fontSize: 12, marginBottom: 4 },
  footerValue: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  chargingTrack: {
    height: 6,
    backgroundColor: "#1f1c2c",
    borderRadius: 3,
    overflow: "hidden",
  },
  chargingFill: { height: "100%", backgroundColor: "#34d399", borderRadius: 3 },

  // Battery Card
  batteryCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  batteryCircleTrack: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: "#1f1c2c",
    alignItems: "center",
    justifyContent: "center",
    borderLeftColor: "#a855f7",
    borderTopColor: "#a855f7",
    transform: [{ rotate: "-45deg" }],
  },
  batteryCircleInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  batteryCircleFill: { position: "absolute" }, // Would use SVG for perfect partial arc in prod
  batteryPct: { color: "#ffffff", fontSize: 32, fontWeight: "800" },
  batteryStatusTxt: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 16,
    fontWeight: "600",
  },

  // Map Card
  mapArea: {
    flex: 1,
    backgroundColor: "#1a1728",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    minHeight: 160,
  },
  mapLine: {
    position: "absolute",
    width: 400,
    height: 2,
    backgroundColor: "rgba(168,85,247,0.1)",
  },
  mapPin: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#9333ea",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPinLg: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(216,180,254,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPinLgInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d8b4fe",
  },
  stationOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#26223a",
    borderRadius: 12,
    padding: 12,
  },
  stationName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  stationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  stationLabel: { color: "#94a3b8", fontSize: 12 },
  stationValue: { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },

  // Trips
  tripList: { gap: 16, flex: 1 },
  tripItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  tripIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tripTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  tripSub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  tripTime: { color: "#94a3b8", fontSize: 11 },
  tripDist: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "right",
  },
  viewAllBtn: { marginTop: "auto", paddingTop: 16, alignItems: "center" },
  viewAllTxt: { color: "#c084fc", fontSize: 13, fontWeight: "700" },

  // Actions
  actionList: { gap: 12, flex: 1 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1d1a2f",
    padding: 16,
    borderRadius: 12,
  },
  actionBtnTxt: { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },

  // Cost Overview
  badge: {
    backgroundColor: "rgba(168,85,247,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#c084fc", fontSize: 10, fontWeight: "700" },
  costTotal: { color: "#ffffff", fontSize: 24, fontWeight: "800" },
  costLabel: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  chartWrap: { flex: 1, flexDirection: "row", marginTop: 10, minHeight: 120 },
  chartYAxis: {
    justifyContent: "space-between",
    paddingRight: 12,
    paddingBottom: 6,
  },
  chartAxisLabel: { color: "#64748b", fontSize: 10 },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  bar: { width: 12, borderRadius: 4 },
  chartXAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 30,
    marginTop: 4,
  },
});
