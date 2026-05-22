import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Switch,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ScreenBackground, GlassCard } from "../components";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../context/ThemeContext";
import { NEARBY_EMERGENCY } from "../constants/shieldDemo";
import { api } from "../services/apiClient";
import { useVoltApi } from "../hooks/useVoltApi";

export function VoltPathShieldScreen() {
  const navigation = useNavigation();
  const stackNav = navigation;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    horizontalPadding,
    contentMaxWidth,
    scaleFont,
    isTablet,
    isLargeScreen,
    isWide,
    isDesktop,
    isMobile,
  } = useResponsive();

  const { userCoord } = useVoltApi();

  const [safetyOn, setSafetyOn] = useState(false);
  const [fWomen, setFWomen] = useState(true);
  const [fFast, setFFast] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [fWait, setFWait] = useState(false);
  const [liveTrack, setLiveTrack] = useState(true);
  const [autoAlert, setAutoAlert] = useState(true);
  const [toast, setToast] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  const [stationsList, setStationsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch safety data from backend
  useEffect(() => {
    let active = true;
    async function fetchSafeData() {
      setLoading(true);
      try {
        const { latitude, longitude } = userCoord || {
          latitude: 0,
          longitude: 0,
        };
        // Fetch safe stations from the API
        const stationsRes = await api(
          `/women-safety/safe-stations?lat=${latitude}&lng=${longitude}&radiusKm=25`,
        );
        if (!active) return;

        const rawStations = stationsRes?.data?.stations || [];
        setStationsList(rawStations);

        // Fetch reviews for each of the top stations
        const reviewsPromises = rawStations.slice(0, 3).map(async (s) => {
          try {
            const revRes = await api(
              `/women-safety/community-reviews/${s._id}`,
            );
            return (revRes?.data?.reviews || []).map((r) => ({
              ...r,
              station: s.stationName,
            }));
          } catch (err) {
            return [];
          }
        });
        const allReviews = await Promise.all(reviewsPromises);
        if (!active) return;
        setReviewsList(allReviews.flat());
      } catch (err) {
        console.error("Failed to fetch safety data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSafeData();
    return () => {
      active = false;
    };
  }, [userCoord]);

  // Client-side filtering for fast interactive chip response
  const filteredStations = useMemo(() => {
    return stationsList.filter((s) => {
      if (fWomen && !s.womenSafe) return false;
      if (fFast && !s.cctv) return false; // fast maps to cctv status
      if (fOpen && !s.open247) return false;
      if (fWait && s.waitMinAvg > 15) return false;
      return true;
    });
  }, [stationsList, fWomen, fFast, fOpen, fWait]);

  // Map to the layout structure expected by the original JSX
  const mappedStations = useMemo(() => {
    return filteredStations.map((s) => ({
      id: s._id || s.id,
      name: s.stationName,
      distanceKm: s.distanceKm,
      chargerType:
        s.chargerTypes?.join(", ") ||
        (s.chargingSpeedKw ? `DC ${s.chargingSpeedKw}kW` : "AC"),
      available: s.slotAvailability?.availableSlots > 0,
      ports: `${s.slotAvailability?.availableSlots || 0} / ${s.slotAvailability?.totalSlots || 0}`,
      safetyRating: s.safetyRating || 4.5,
      cctv: s.cctv,
      open247: s.open247,
      crowd:
        s.slotAvailability?.availableSlots < 2
          ? "High"
          : s.slotAvailability?.availableSlots < 4
            ? "Moderate"
            : "Low",
      waitMin: s.waitMinAvg || 0,
      womenSafe: s.womenSafe,
    }));
  }, [filteredStations]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const contentPad = {
    paddingHorizontal: horizontalPadding,
    paddingTop: 24,
    paddingBottom: insets.bottom + 100,
    ...(contentMaxWidth
      ? { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }
      : {}),
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#09090b" }}>
      <ScrollView
        contentContainerStyle={contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Navbar */}
        <View style={styles.navBar}>
          <View style={styles.navBrand}>
            <View style={styles.navLogoElectra}>
              <Ionicons name="flash" size={14} color="#ffffff" />
            </View>
            <Text style={styles.navBrandText}>ELECTRA</Text>
          </View>

          {/* Hide Links on small mobile, show on tablet+ */}
          {!(isMobile && !isTablet) && (
            <View style={styles.navLinks}>
              <Pressable onPress={() => navigation.navigate("Home")}>
                <Text style={styles.navLinkInactive}>Home</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Map")}>
                <Text style={styles.navLinkInactive}>Map</Text>
              </Pressable>
              <Pressable onPress={() => stackNav.navigate("ChargingVan")}>
                <Text style={styles.navLinkInactive}>Van</Text>
              </Pressable>
              <Pressable style={styles.navLinkContainer}>
                <Text style={styles.navLinkActive}>Safety</Text>
                <View style={styles.navLinkActiveBar} />
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

        {/* Main Content Panels */}
        <View
          style={[
            styles.mainLayout,
            isDesktop || isTablet || isLargeScreen
              ? styles.rowLayout
              : styles.colLayout,
          ]}
        >
          {/* Left Panel: Women Safety */}
          <View style={styles.leftPanel}>
            <View style={styles.headerSection}>
              <View style={styles.shieldIconWrap}>
                <Ionicons name="shield" size={28} color="#ffffff" />
                <View style={styles.shieldBolt}>
                  <Ionicons name="flash" size={14} color="#a855f7" />
                </View>
              </View>
              <View>
                <Text style={styles.panelTitle}>Women Safety</Text>
                <Text style={styles.panelSub}>Your safety is our priority</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              <Pressable
                style={styles.featureItem}
                onPress={async () => {
                  try {
                    await api("/women-safety/share-location", {
                      method: "POST",
                      body: {
                        lat: userCoord?.latitude,
                        lng: userCoord?.longitude,
                        message: "VoltPath Shield Live Location Share",
                      },
                    });
                    showToast("Live location shared with guardians.");
                  } catch (err) {
                    showToast(err.message || "Share failed.");
                  }
                }}
              >
                <View style={styles.featureIconBox}>
                  <Ionicons name="location-outline" size={20} color="#c084fc" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Share Live Location</Text>
                  <Text style={styles.featureDesc}>
                    Share your real-time location with trusted contacts.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.featureItem}
                onPress={() => {
                  setSafetyOn(true);
                  showToast("Safety timer activated.");
                }}
              >
                <View style={styles.featureIconBox}>
                  <Ionicons
                    name="stopwatch-outline"
                    size={20}
                    color="#c084fc"
                  />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Safety Timer</Text>
                  <Text style={styles.featureDesc}>
                    Set a timer and stay safe. We'll alert if needed.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.featureItem}
                onPress={() => showToast("Manage emergency contacts")}
              >
                <View style={styles.featureIconBox}>
                  <Ionicons
                    name="people-circle-outline"
                    size={20}
                    color="#c084fc"
                  />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Emergency Contacts</Text>
                  <Text style={styles.featureDesc}>
                    Manage your emergency contacts easily.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.featureItem}
                onPress={() =>
                  showToast(
                    "Safety tips: Stay in well-lit areas, keep phone charged.",
                  )
                }
              >
                <View style={styles.featureIconBox}>
                  <Ionicons name="bulb-outline" size={20} color="#c084fc" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Safety Tips</Text>
                  <Text style={styles.featureDesc}>
                    Helpful tips to stay safe everywhere.
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Right Panel: Emergency Services */}
          <View style={styles.rightPanel}>
            <Text style={styles.rightTitle}>Emergency Services</Text>

            <View style={styles.grid}>
              <View style={styles.card}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="shield" size={28} color="#94a3b8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Police Force</Text>
                  <Text style={styles.cardNumber}>100</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="medical" size={28} color="#f87171" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Ambulance</Text>
                  <Text style={styles.cardNumber}>108</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="woman" size={28} color="#d946ef" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Women Helpline</Text>
                  <Text style={styles.cardNumber}>1091</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="flame" size={28} color="#fb923c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Fire Service</Text>
                  <Text style={styles.cardNumber}>101</Text>
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => {
                Linking.openURL("tel:112").catch(() => {
                  Alert.alert("Error", "Could not open dialer. Please dial 112 directly.");
                });
              }}
              style={({ pressed }) => [
                styles.callBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.callBtnText}>Call Emergency</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 88 }]}>
          <Text style={{ color: "#ffffff", fontSize: 13, textAlign: "center" }}>
            {toast}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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

  mainLayout: { gap: 16 },
  rowLayout: { flexDirection: "row", alignItems: "stretch" },
  colLayout: { flexDirection: "column" },

  leftPanel: {
    flex: 1.1,
    backgroundColor: "#161421",
    borderRadius: 20,
    padding: 24,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#161421",
    borderRadius: 20,
    padding: 24,
    flexDirection: "column",
  },

  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  shieldIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#9333ea",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldBolt: {
    position: "absolute",
    backgroundColor: "#ffffff",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { color: "#ffffff", fontSize: 24, fontWeight: "700" },
  panelSub: { color: "#a1a1aa", fontSize: 14, marginTop: 4 },

  featureList: { gap: 12 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#1f1b2e",
    borderRadius: 16,
    padding: 16,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: { flex: 1 },
  featureTitle: { color: "#e2e8f0", fontSize: 16, fontWeight: "600" },
  featureDesc: { color: "#94a3b8", fontSize: 13, marginTop: 4, lineHeight: 18 },

  rightTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#26223a",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardNumber: { color: "#ffffff", fontSize: 22, fontWeight: "800" },

  callBtn: {
    backgroundColor: "#9333ea",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 24,
  },
  callBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#1e1b4b",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3730a3",
  },
});
