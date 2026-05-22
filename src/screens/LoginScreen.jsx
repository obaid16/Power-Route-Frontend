import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../hooks/useResponsive";

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, signup, verifyEmail, resendOtp } = useAuth();
  const { isLargeScreen, isTablet, isMobile } = useResponsive();

  const isDesktop = isLargeScreen || (!isMobile && !isTablet);

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef([]);

  // ── OTP box helpers ────────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const otpValue = otp.join("");

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        navigation.replace("Main");
      } else if (mode === "signup") {
        await signup(name.trim(), email.trim(), phone.trim(), password);
        setMode("otp");
      } else if (mode === "otp") {
        await verifyEmail(email.trim(), otpValue);
        navigation.replace("Main");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await resendOtp(email.trim());
      setOtp(["", "", "", "", "", ""]);
    } catch (e) {
      setError(e.message || "Could not resend OTP");
    } finally {
      setResending(false);
    }
  };

  const canSubmit = mode === "otp" ? otpValue.length === 6 : email && password;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#090812" }}>
      {/* ── Left Panel (Form) ────────────────────────────── */}
      <View style={{ flex: 1, position: "relative" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: isDesktop ? 64 : 32,
              paddingTop: 48,
              paddingBottom: 24,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                maxWidth: 440,
                width: "100%",
                alignSelf: isDesktop ? "flex-start" : "center",
                marginLeft: isDesktop ? "auto" : 0,
                marginRight: isDesktop ? 64 : 0,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 50,
                    backgroundColor: "#9333ea",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ rotate: "-45deg" }],
                  }}
                >
                  <Ionicons
                    name="flash"
                    size={24}
                    color="#ffffff"
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                </View>
                <View style={{ marginLeft: 16 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 24,
                      fontWeight: "800",
                    }}
                  >
                    Power <Text style={{ color: "#a855f7" }}>Route</Text>
                  </Text>
                  <Text
                    style={{ color: "#e2e8f0", fontSize: 13, marginTop: 2 }}
                  >
                    Charge. Drive. Explore.
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 40, marginBottom: 32 }}>
                <Text
                  style={{ color: "#ffffff", fontSize: 32, fontWeight: "800" }}
                >
                  Welcome <Text style={{ color: "#c084fc" }}>Back!</Text>
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 15, marginTop: 8 }}>
                  Login to continue your EV journey
                </Text>
              </View>

              {/* Form fields */}
              {mode === "otp" ? (
                <>
                  <Text
                    style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}
                  >
                    Enter the 6-digit code sent to {email}
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}
                  >
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(r) => {
                          otpRefs.current[i] = r;
                        }}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, i)}
                        onKeyPress={(e) => handleOtpKeyPress(e, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={{
                          width: 48,
                          height: 56,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#1f1c2c",
                          backgroundColor: "#0c0a15",
                          textAlign: "center",
                          fontSize: 24,
                          color: "#ffffff",
                          fontWeight: "700",
                        }}
                      />
                    ))}
                  </View>
                  <Pressable onPress={handleResend} disabled={resending}>
                    <Text
                      style={{
                        color: "#c084fc",
                        fontSize: 13,
                        fontWeight: "600",
                        marginBottom: 24,
                      }}
                    >
                      {resending
                        ? "Sending…"
                        : "Didn't receive it? Resend code"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {mode === "signup" && (
                    <Field
                      label="Full Name"
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      icon="person-outline"
                    />
                  )}
                  <Field
                    label="Email or Phone Number"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email or phone number"
                    icon="person-outline"
                  />
                  {mode === "signup" && (
                    <Field
                      label="Phone number"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter phone number"
                      icon="call-outline"
                    />
                  )}
                  <Field
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    icon="lock-closed-outline"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />

                  {mode === "login" && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: -8,
                        marginBottom: 32,
                      }}
                    >
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            backgroundColor: rememberMe
                              ? "#9333ea"
                              : "transparent",
                            borderWidth: rememberMe ? 0 : 1,
                            borderColor: "#64748b",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {rememberMe && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#ffffff"
                            />
                          )}
                        </View>
                        <Text
                          style={{
                            color: "#e2e8f0",
                            fontSize: 13,
                            marginLeft: 8,
                          }}
                        >
                          Remember me
                        </Text>
                      </Pressable>
                      <Pressable>
                        <Text
                          style={{
                            color: "#c084fc",
                            fontSize: 13,
                            fontWeight: "500",
                          }}
                        >
                          Forgot Password?
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}

              {error ? (
                <Text
                  style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={submit}
                disabled={loading || !canSubmit}
                style={({ pressed }) => ({
                  backgroundColor: "#9333ea",
                  borderRadius: 12,
                  height: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading || !canSubmit ? 0.6 : pressed ? 0.9 : 1,
                  marginBottom: 32,
                })}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {mode === "login"
                        ? "Login"
                        : mode === "signup"
                          ? "Sign up"
                          : "Verify"}
                    </Text>
                    {mode === "login" && (
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#ffffff"
                        style={{ position: "absolute", right: 20 }}
                      />
                    )}
                  </>
                )}
              </Pressable>

              {mode === "login" && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 24,
                    }}
                  >
                    <View
                      style={{ flex: 1, height: 1, backgroundColor: "#1f1c2c" }}
                    />
                    <Text
                      style={{
                        color: "#64748b",
                        marginHorizontal: 16,
                        fontSize: 13,
                      }}
                    >
                      or continue with
                    </Text>
                    <View
                      style={{ flex: 1, height: 1, backgroundColor: "#1f1c2c" }}
                    />
                  </View>

                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#1f1c2c",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="logo-google" size={20} color="#ea4335" />
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 12,
                      }}
                    >
                      Continue with Google
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#1f1c2c",
                      marginBottom: 32,
                    }}
                  >
                    <Ionicons name="logo-apple" size={20} color="#ffffff" />
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 12,
                      }}
                    >
                      Continue with Apple
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setMode("signup");
                      setError("");
                    }}
                    style={{ alignItems: "center", marginBottom: 48 }}
                  >
                    <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                      Don't have an account?{" "}
                      <Text style={{ color: "#c084fc", fontWeight: "600" }}>
                        Sign up
                      </Text>
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Bottom Feature Icons Box */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: "#0c0a15",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#1f1c2c",
                  marginBottom: 32,
                }}
              >
                <FeatureIcon
                  icon="location"
                  color="#c084fc"
                  label="Find Charging\nStations"
                />
                <FeatureIcon
                  icon="flash"
                  color="#c084fc"
                  label="Fast & Reliable\nCharging"
                />
                <FeatureIcon
                  icon="shield-checkmark"
                  color="#c084fc"
                  label="Safe & Secure\nJourney"
                />
                <FeatureIcon
                  icon="people"
                  color="#c084fc"
                  label="Women Safety\nSupport"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Global Footer injected at the bottom of the left panel */}
        <View
          style={{
            paddingVertical: 24,
            paddingHorizontal: 32,
            borderTopWidth: 1,
            borderColor: "#1f1c2c",
            backgroundColor: "#090812",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 32,
              marginBottom: 16,
            }}
          >
            <FooterItem icon="lock-closed" text="Secure Login" />
            <FooterItem icon="shield-checkmark" text="Your Data is Protected" />
            <FooterItem icon="headset" text="24/7 Support" />
          </View>
          <Text style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>
            © 2024 Power Route. All rights reserved.
          </Text>
        </View>
      </View>

      {/* ── Right Panel (Image) ───────────────────────────── */}
      {isDesktop && (
        <View style={{ flex: 1, position: "relative" }}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1662990640306-4b8cb8376de9?q=80&w=1200&auto=format&fit=crop",
            }}
            style={{ flex: 1, justifyContent: "center" }}
            resizeMode="cover"
          >
            {/* Dark overlay to simulate neon look */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(147, 51, 234, 0.3)",
              }}
            />
            <View style={{ position: "absolute", top: 64, left: 64 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#a855f7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="leaf-outline" size={24} color="#a855f7" />
              </View>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 24,
                  fontWeight: "500",
                  lineHeight: 34,
                }}
              >
                Powering a{" "}
                <Text style={{ color: "#c084fc", fontWeight: "700" }}>
                  greener
                </Text>
                {"\n"}tomorrow, together.
              </Text>
            </View>
          </ImageBackground>
        </View>
      )}
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 13,
          fontWeight: "600",
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 54,
          borderRadius: 12,
          backgroundColor: "#0c0a15",
          borderWidth: 1,
          borderColor: "#1f1c2c",
          paddingHorizontal: 16,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#a855f7"
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={secureTextEntry}
          style={{ flex: 1, color: "#ffffff", fontSize: 14 }}
          autoCapitalize="none"
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color="#64748b" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function FeatureIcon({ icon, color, label }) {
  return (
    <View style={{ alignItems: "center", width: 70 }}>
      <Ionicons
        name={icon}
        size={24}
        color={color}
        style={{ marginBottom: 8 }}
      />
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 10,
          textAlign: "center",
          lineHeight: 14,
        }}
      >
        {label.replace("\\n", "\n")}
      </Text>
    </View>
  );
}

function FooterItem({ icon, text }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons
        name={icon}
        size={16}
        color="#c084fc"
        style={{ marginRight: 8 }}
      />
      <Text style={{ color: "#e2e8f0", fontSize: 12 }}>{text}</Text>
    </View>
  );
}

