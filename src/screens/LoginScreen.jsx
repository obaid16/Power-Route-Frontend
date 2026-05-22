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
import { LinearGradient } from "expo-linear-gradient";

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, signup, verifyEmail, resendOtp, socialLogin } = useAuth();
  const { isLargeScreen, isTablet, isMobile } = useResponsive();

  const isDesktop = isLargeScreen || (!isMobile && !isTablet);

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [vehicleType, setVehicleType] = useState("");
  const [evBrand, setEvBrand] = useState("");
  const [evModel, setEvModel] = useState("");
  const [chargingPort, setChargingPort] = useState("");
  const [preferredLang, setPreferredLang] = useState("");

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

  const handleSocialLogin = async (provider) => {
    setError("");
    setLoading(true);
    try {
      const socialEmail = email.trim() || `${provider}.user@example.com`;
      const socialName = name.trim() || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
      const socialId = `${provider}-${Math.random().toString(36).substr(2, 9)}`;

      await socialLogin(socialEmail, socialName, socialId, provider);
      navigation.replace("Main");
    } catch (e) {
      setError(e.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    mode === "otp"
      ? otpValue.length === 6
      : email && password && (mode === "signup" ? name && confirmPassword : true);

  return (
    <ImageBackground
      source={require("../../assets/login_hero.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: "rgba(9, 8, 18, 0.7)" }}>
        {/* ── Two-panel row ─────────────────────────────────── */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* ── Left Panel (Form) ────────────────────────────── */}
          <View style={{ flex: 1, position: "relative", backgroundColor: "rgba(9, 8, 18, 0.3)" }}>
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
                {/* ── Logo Header ──────────────────────────── */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 32,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 54,
                      backgroundColor: "#a855f7",
                      borderTopLeftRadius: 22,
                      borderTopRightRadius: 22,
                      borderBottomLeftRadius: 22,
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
                        fontSize: 26,
                        fontWeight: "800",
                      }}
                    >
                      Power <Text style={{ color: "#a855f7" }}>Route</Text>
                    </Text>
                    <Text
                      style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}
                    >
                      Charge. Drive. Explore.
                    </Text>
                  </View>
                </View>

                {/* ── Welcome Text ─────────────────────────── */}
                <View style={{ marginBottom: 32 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 28,
                      fontWeight: "800",
                    }}
                  >
                    {mode === "signup"
                      ? "Create "
                      : mode === "login"
                        ? "Welcome "
                        : "Verify "}
                    <Text style={{ color: "#c084fc" }}>
                      {mode === "signup"
                        ? "Your Account"
                        : mode === "login"
                          ? "Back!"
                          : "Email"}
                    </Text>
                  </Text>
                  <Text
                    style={{ color: "#94a3b8", fontSize: 14, marginTop: 8 }}
                  >
                    {mode === "signup"
                      ? "Join Power Route and make every journey effortless."
                      : mode === "login"
                        ? "Login to continue your EV journey"
                        : `Enter the 6-digit code sent to ${email}`}
                  </Text>
                </View>

                {/* ── Form Fields ──────────────────────────── */}
                {mode === "otp" ? (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginBottom: 24,
                      }}
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
                    {/* Signup: Personal Information */}
                    {mode === "signup" && (
                      <>
                        <SectionHeader
                          icon="person-outline"
                          title="Personal Information"
                        />
                        <Field
                          label="Full Name"
                          value={name}
                          onChangeText={setName}
                          placeholder="Enter your full name"
                          icon="person-outline"
                        />
                      </>
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
                        label="Phone Number"
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
                      rightIcon={
                        showPassword ? "eye-off-outline" : "eye-outline"
                      }
                      onRightIconPress={() => setShowPassword(!showPassword)}
                    />

                    {mode === "signup" && (
                      <Field
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        icon="lock-closed-outline"
                        secureTextEntry={!showConfirmPassword}
                        rightIcon={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onRightIconPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    )}

                    {/* Signup: Vehicle Information (Optional) */}
                    {mode === "signup" && (
                      <>
                        <SectionHeader
                          icon="car-outline"
                          title="Vehicle Information (Optional)"
                        />
                        <View
                          style={{
                            flexDirection: isDesktop ? "row" : "column",
                            gap: 16,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <DropdownField
                              value={vehicleType}
                              placeholder="Vehicle Type"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <DropdownField
                              value={evBrand}
                              placeholder="EV Brand"
                            />
                          </View>
                        </View>
                        <View
                          style={{
                            flexDirection: isDesktop ? "row" : "column",
                            gap: 16,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <DropdownField
                              value={evModel}
                              placeholder="EV Model"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <DropdownField
                              value={chargingPort}
                              placeholder="Charging Port Type"
                            />
                          </View>
                        </View>

                        {/* Additional Information Section (Optional) */}
                        <SectionHeader
                          icon="information-circle-outline"
                          title="Additional (Optional)"
                        />
                        <DropdownField
                          value={preferredLang}
                          placeholder="Preferred Language"
                          defaultValue="English"
                          icon="globe-outline"
                        />

                        {/* T&C Checkbox */}
                        <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 32,
                          }}
                          onPress={() => setAgree(!agree)}
                        >
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              borderWidth: agree ? 0 : 1,
                              borderColor: "#64748b",
                              backgroundColor: agree
                                ? "#10b981"
                                : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            {agree && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#fff"
                              />
                            )}
                          </View>
                          <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                            I agree to the{" "}
                            <Text
                              style={{
                                color: "#a855f7",
                                textDecorationLine: "underline",
                              }}
                            >
                              Terms & Conditions
                            </Text>{" "}
                            and{" "}
                            <Text
                              style={{
                                color: "#a855f7",
                                textDecorationLine: "underline",
                              }}
                            >
                              Privacy Policy
                            </Text>
                          </Text>
                        </Pressable>
                      </>
                    )}

                    {/* Login: Remember me + Forgot Password */}
                    {mode === "login" && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: -4,
                          marginBottom: 32,
                        }}
                      >
                        <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
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

                {/* ── Error Message ────────────────────────── */}
                {error ? (
                  <Text
                    style={{
                      color: "#ef4444",
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* ── Submit Button ────────────────────────── */}
                <Pressable
                  onPress={submit}
                  disabled={loading || !canSubmit}
                  style={{
                    opacity: loading || !canSubmit ? 0.6 : 1,
                    marginBottom: 32,
                  }}
                >
                  <LinearGradient
                    colors={["#8b5cf6", "#9333ea"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 54,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
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
                              ? "Create Account"
                              : "Verify"}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#ffffff"
                          style={{ position: "absolute", right: 20 }}
                        />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* ── Social Login ─────────────────────────── */}
                {mode !== "otp" && (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 24,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: "#1f1c2c",
                        }}
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
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: "#1f1c2c",
                        }}
                      />
                    </View>

                    <Pressable
                      onPress={() => handleSocialLogin("google")}
                      disabled={loading}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 50,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#1f1c2c",
                        backgroundColor: "#0c0a15",
                        marginBottom: 16,
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <Ionicons name="logo-google" size={20} color="#ea4335" />
                      <Text
                        style={{
                          color: "#e2e8f0",
                          fontSize: 14,
                          fontWeight: "600",
                          marginLeft: 12,
                        }}
                      >
                        Continue with Google
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSocialLogin("apple")}
                      disabled={loading}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 50,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#1f1c2c",
                        backgroundColor: "#0c0a15",
                        marginBottom: 32,
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <Ionicons name="logo-apple" size={20} color="#ffffff" />
                      <Text
                        style={{
                          color: "#e2e8f0",
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
                        setMode(mode === "signup" ? "login" : "signup");
                        setError("");
                      }}
                      style={{ alignItems: "center", marginBottom: 48 }}
                    >
                      <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                        {mode === "signup"
                          ? "Already have an account? "
                          : "Don't have an account? "}
                        <Text
                          style={{ color: "#c084fc", fontWeight: "600" }}
                        >
                          {mode === "signup" ? "Login" : "Sign up"}
                        </Text>
                      </Text>
                    </Pressable>
                  </>
                )}

                {/* ── Bottom Feature Icons ─────────────────── */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    backgroundColor: "#08070d",
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: "#1f1c2c",
                    marginBottom: 32,
                  }}
                >
                  <FeatureIcon
                    icon="location-outline"
                    color="#a855f7"
                    label={"Find Charging\nStations"}
                  />
                  <FeatureIcon
                    icon="flash-outline"
                    color="#a855f7"
                    label={"Fast & Reliable\nCharging"}
                  />
                  <FeatureIcon
                    icon="shield-checkmark-outline"
                    color="#a855f7"
                    label={"Safe & Secure\nJourney"}
                  />
                  <FeatureIcon
                    icon="people-outline"
                    color="#a855f7"
                    label={"Women Safety\nSupport"}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        {/* ── Right Panel (Hero Content) ───────────────────────────── */}
        {isDesktop && (
          <View style={{ flex: 1.2, position: "relative" }}>
            <View
              style={{
                flex: 1,
                justifyContent: "space-between",
                padding: 64,
              }}
            >
              {/* Top Text floating */}
              <View style={{ alignItems: "center", marginTop: 40 }}>
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
                    fontSize: 32,
                    fontWeight: "400",
                    lineHeight: 42,
                    textAlign: "center",
                  }}
                >
                  Powering a{" "}
                  <Text style={{ color: "#c084fc", fontWeight: "700" }}>
                    greener
                  </Text>
                  {"\n"}tomorrow, together.
                </Text>
              </View>

              {/* Bottom 3 Pills */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <FooterPill
                  icon="shield-checkmark-outline"
                  title="Secure & Encrypted"
                  sub="Your data is protected"
                />
                <FooterPill
                  icon="lock-closed-outline"
                  title="Privacy First"
                  sub="We respect your privacy"
                />
                <FooterPill
                  icon="headset-outline"
                  title="24/7 Support"
                  sub="We're here for you"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Full-width Footer ───────────────────────────── */}
      <View
        style={{
          paddingVertical: 24,
          paddingHorizontal: 32,
          borderTopWidth: 1,
          borderColor: "#1f1c2c",
          backgroundColor: "rgba(9, 8, 18, 0.8)",
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
        <Text
          style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}
        >
          © 2024 Power Route. All rights reserved.
        </Text>
      </View>
      </View>
    </ImageBackground>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        marginTop: 8,
      }}
    >
      <Ionicons name={icon} size={16} color="#c084fc" />
      <Text style={{ color: "#e2e8f0", fontSize: 13, fontWeight: "600" }}>
        {title}
      </Text>
    </View>
  );
}

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
    <View style={{ marginBottom: 16 }}>
      {label && (
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
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 50,
          borderRadius: 10,
          backgroundColor: "#0c0a15",
          borderWidth: 1,
          borderColor: "#1f1c2c",
          paddingHorizontal: 16,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
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
          style={{ flex: 1, color: "#ffffff", fontSize: 13 }}
          autoCapitalize="none"
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={18} color="#64748b" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DropdownField({ value, placeholder, defaultValue, icon }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 50,
          borderRadius: 10,
          backgroundColor: "#0c0a15",
          borderWidth: 1,
          borderColor: "#1f1c2c",
          paddingHorizontal: 16,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color="#a855f7"
            style={{ marginRight: 12 }}
          />
        )}
        <Text
          style={{
            flex: 1,
            color: value || defaultValue ? "#ffffff" : "#64748b",
            fontSize: 13,
          }}
        >
          {value || defaultValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </View>
    </View>
  );
}

function FeatureIcon({ icon, color, label }) {
  return (
    <View style={{ alignItems: "center", width: 80 }}>
      <Ionicons
        name={icon}
        size={24}
        color={color}
        style={{ marginBottom: 8 }}
      />
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        {label}
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

function FooterPill({ icon, title, sub }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "rgba(12, 10, 21, 0.7)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(168, 85, 247, 0.3)",
      }}
    >
      <Ionicons name={icon} size={24} color="#c084fc" />
      <View>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
          {title}
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
    </View>
  );
}
