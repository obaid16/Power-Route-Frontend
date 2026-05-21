/**
 * LoginScreen — PowerRoute mobile
 *
 * Screens:
 *  'login'  → email + password
 *  'signup' → name + email + phone + password → sends OTP
 *  'otp'    → 6-digit OTP verification
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassCard, ThemeToggle } from '../components';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../config/env';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, signup, verifyEmail, resendOtp } = useAuth();
  const { colors, isDark } = useTheme();
  const { horizontalPadding, loginMaxWidth, scaleFont, iconSize, isLargeScreen } = useResponsive();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode, setMode]         = useState('login');   // 'login' | 'signup' | 'otp'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);

  const otpRefs = useRef([]);

  const inputBg     = isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.95)';
  const inputBorder = isDark ? 'rgba(0,217,126,0.12)' : 'rgba(100,116,139,0.18)';

  // ── OTP box helpers ────────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.replace(/\D/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const otpValue = otp.join('');

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigation.replace('Main');
      } else if (mode === 'signup') {
        await signup(name.trim(), email.trim(), phone.trim(), password);
        setMode('otp');
      } else if (mode === 'otp') {
        await verifyEmail(email.trim(), otpValue);
        navigation.replace('Main');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await resendOtp(email.trim());
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  const canSubmit = mode === 'otp' ? otpValue.length === 6 : email && password;

  const logoSize = iconSize.lg + (isLargeScreen ? 34 : 26);

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1, justifyContent: 'center',
            paddingHorizontal: horizontalPadding, paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={loginMaxWidth ? { maxWidth: loginMaxWidth, width: '100%', alignSelf: 'center' } : undefined}>

            {/* Theme toggle */}
            <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
              <ThemeToggle size="sm" showLabel />
            </View>

            {/* Logo with Gradient Border & Glow */}
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <LinearGradient
                colors={isDark ? [colors.accentCyan, colors.accentMint] : [colors.accentCyan, colors.accentGlow]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  marginBottom: 16,
                  padding: 2,
                  borderRadius: 22,
                  shadowColor: colors.accentCyan,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isDark ? 0.35 : 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View style={{
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: isDark ? '#0d1f35' : '#ffffff',
                  height: logoSize, width: logoSize,
                }}>
                  <Ionicons name="flash" size={iconSize.lg} color={colors.accentCyan} />
                </View>
              </LinearGradient>
              
              <Text style={{ fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 34 : 28), letterSpacing: -0.5 }}>
                PowerRoute
              </Text>
              <Text style={{ marginTop: 6, textAlign: 'center', color: colors.textMuted, fontSize: scaleFont(13) }}>
                {mode === 'otp'
                  ? `Enter the 6-digit code sent to ${email}`
                  : mode === 'signup'
                  ? 'Create your account'
                  : 'Smart EV navigation & emergency assist'}
              </Text>
            </View>

            {/* Form card */}
            <GlassCard padding={isLargeScreen ? 24 : 20}>
              <Text style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, color: colors.textFaint, fontSize: scaleFont(11) }}>
                {mode === 'otp' ? 'Email verification' : 'Secure access'}
              </Text>

              {/* Dynamic Divider Line */}
              <View style={{ height: 1.5, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', width: '100%', marginVertical: 14 }} />

              {/* ── OTP mode ─────────────────────────────────────────────── */}
              {mode === 'otp' ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(r) => { otpRefs.current[i] = r; }}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, i)}
                        onKeyPress={(e) => handleOtpKeyPress(e, i)}
                        onFocus={() => setFocusedOtpIndex(i)}
                        onBlur={() => setFocusedOtpIndex(null)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        style={{
                          width: isLargeScreen ? 52 : 44,
                          height: isLargeScreen ? 60 : 52,
                          borderRadius: 12, borderWidth: 2,
                          borderColor: focusedOtpIndex === i 
                            ? colors.accentCyan 
                            : digit 
                            ? colors.accentMint 
                            : inputBorder,
                          backgroundColor: inputBg,
                          textAlign: 'center',
                          fontSize: scaleFont(22), fontWeight: '700',
                          color: colors.text,
                          shadowColor: colors.accentCyan,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: focusedOtpIndex === i ? 0.2 : 0,
                          shadowRadius: 6,
                        }}
                      />
                    ))}
                  </View>
                  <Pressable onPress={handleResend} disabled={resending} style={{ alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: colors.accentCyan, fontSize: scaleFont(12), fontWeight: '600' }}>
                      {resending ? 'Sending…' : "Didn't receive it? Resend code"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {/* ── Signup fields ──────────────────────────────────── */}
                  {mode === 'signup' && (
                    <>
                      <Field label="Full name" value={name} onChangeText={setName}
                        placeholder="Your full name" colors={colors} inputBg={inputBg}
                        inputBorder={inputBorder} scaleFont={scaleFont} isLargeScreen={isLargeScreen}
                        icon="person-outline" />
                    </>
                  )}

                  <Field label="Email" value={email} onChangeText={setEmail}
                    placeholder="you@domain.com" keyboardType="email-address"
                    autoCapitalize="none" colors={colors} inputBg={inputBg}
                    inputBorder={inputBorder} scaleFont={scaleFont} isLargeScreen={isLargeScreen}
                    icon="mail-outline" />

                  {mode === 'signup' && (
                    <Field label="Phone number" value={phone} onChangeText={setPhone}
                      placeholder="+1 234 567 8900" keyboardType="phone-pad"
                      colors={colors} inputBg={inputBg} inputBorder={inputBorder}
                      scaleFont={scaleFont} isLargeScreen={isLargeScreen}
                      icon="phone-portrait-outline" />
                  )}

                  <Field label="Password" value={password} onChangeText={setPassword}
                    placeholder="8+ characters" secureTextEntry
                    colors={colors} inputBg={inputBg} inputBorder={inputBorder}
                    scaleFont={scaleFont} isLargeScreen={isLargeScreen}
                    icon="lock-closed-outline" last />
                </>
              )}

              {/* Error */}
              {error ? (
                <View style={{ marginTop: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.1)', padding: 10 }}>
                  <Text style={{ color: colors.danger, fontSize: scaleFont(12), fontWeight: '500' }}>{error}</Text>
                </View>
              ) : null}

              {/* Submit Button with Gradient */}
              <Pressable
                onPress={submit}
                disabled={loading || !canSubmit}
                style={({ pressed }) => ({
                  marginTop: 24, borderRadius: 12,
                  overflow: 'hidden',
                  opacity: loading || !canSubmit ? 0.5 : pressed ? 0.88 : 1,
                  shadowColor: colors.accentCyan,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                })}
              >
                <LinearGradient
                  colors={isDark ? [colors.accentCyan, colors.accentMint] : [colors.accentCyan, colors.accentGlow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: isLargeScreen ? 18 : 16,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={isDark ? "#020617" : "#ffffff"} />
                  ) : (
                    <Text style={{ fontWeight: '800', color: isDark ? '#020617' : '#ffffff', fontSize: scaleFont(isLargeScreen ? 17 : 15), letterSpacing: 0.5 }}>
                      {mode === 'otp' ? 'Verify & continue' : mode === 'signup' ? 'Create account' : 'Enter PowerRoute'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Mode switch */}
              {mode !== 'otp' && (
                <Pressable
                  onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
                  style={{ marginTop: 16 }}
                >
                  <Text style={{ textAlign: 'center', color: colors.accentCyan, fontSize: scaleFont(12), fontWeight: '600' }}>
                    {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
                  </Text>
                </Pressable>
              )}

              {mode === 'otp' && (
                <Pressable onPress={() => { setMode('signup'); setError(''); }} style={{ marginTop: 16 }}>
                  <Text style={{ textAlign: 'center', color: colors.textFaint, fontSize: scaleFont(12), fontWeight: '500' }}>
                    ← Back to sign up
                  </Text>
                </Pressable>
              )}

              <Text style={{ marginTop: 16, textAlign: 'center', color: colors.textFaint, fontSize: scaleFont(10), letterSpacing: 0.2 }}>
                API: {getApiBaseUrl()}
              </Text>
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

// ── Reusable input field ──────────────────────────────────────────────────────
function Field({ label, last, colors, inputBg, inputBorder, scaleFont, isLargeScreen, icon, ...inputProps }) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <Text style={{ marginBottom: 6, color: colors.textMuted, fontSize: scaleFont(isLargeScreen ? 13 : 12), fontWeight: '600', marginTop: 12 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: last ? 0 : 4,
        width: '100%',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: focused ? colors.accentCyan : inputBorder,
        backgroundColor: inputBg,
        paddingHorizontal: 16,
        shadowColor: colors.accentCyan,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: focused ? (colors.cardGlow ? 0.25 : 0.15) : 0,
        shadowRadius: 8,
      }}>
        {icon && (
          <Ionicons
            name={icon}
            size={scaleFont(18)}
            color={focused ? colors.accentCyan : colors.textFaint}
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            paddingVertical: isLargeScreen ? 16 : 14,
            fontSize: scaleFont(15),
            color: colors.text,
          }}
        />
      </View>
    </>
  );
}
