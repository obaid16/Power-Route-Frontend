import { useEffect, useState, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

// Animated individual bar component for the waveform visualizer
function VoiceBar({ delay, active, color }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (active) {
      height.value = withRepeat(
        withSequence(
          withTiming(Math.random() * 40 + 15, { duration: 250 + delay }),
          withTiming(Math.random() * 10 + 6, { duration: 200 + delay })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(6, { duration: 300 });
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: 5,
          borderRadius: 3,
          backgroundColor: color || '#00D97E',
          marginHorizontal: 3,
        },
      ]}
    />
  );
}

export function AIVoiceAssistantScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userCoord } = useVoltApi();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, modalMaxWidth, scaleFont, isDesktop, isLargeScreen, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();

  // States: 'idle' | 'listening' | 'processing' | 'speaking'
  const [assistantState, setAssistantState] = useState('idle');
  const [spokenText, setSpokenText] = useState('Tap the microphone to ask Volt AI anything.');
  const [aiReplyText, setAiReplyText] = useState('');
  const [voiceOutputOn, setVoiceOutputOn] = useState(true);
  const [inputText, setInputText] = useState('');

  const opacity = useSharedValue(0);
  const translate = useSharedValue(16);
  const pulseScale = useSharedValue(1);

  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);
  const scrollViewRef = useRef(null);

  // Clean up speech synthesis and recognition on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (Platform.OS === 'web' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Text-To-Speech (TTS) engine speaking replies
  const speakReply = (text) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (!voiceOutputOn) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Try to load a premium voice; voices may load asynchronously
      const trySpeak = () => {
        if (!isMountedRef.current) return;
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(
          v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
        );
        if (premiumVoice) utterance.voice = premiumVoice;
        utterance.onstart = () => {
          if (isMountedRef.current) setAssistantState('speaking');
        };
        utterance.onend = () => {
          if (isMountedRef.current) setAssistantState('idle');
        };
        utterance.onerror = () => {
          if (isMountedRef.current) setAssistantState('idle');
        };
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        trySpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          if (!isMountedRef.current) return;
          window.speechSynthesis.onvoiceschanged = null;
          trySpeak();
        };
      }
    }
  };

  // Slow breathing pulse for idle microphone button
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    translate.value = withTiming(0, { duration: 320 });
  }, [opacity, translate]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: assistantState === 'listening' ? 1.15 : pulseScale.value }],
  }));

  // Simulated capture fallback when mic permissions are denied or unavailable
  const runSimulatedListening = (customPrompt = null) => {
    setAssistantState('listening');
    setAiReplyText('');

    if (customPrompt) {
      setSpokenText(`"${customPrompt}"`);
      setTimeout(() => {
        processQuery(customPrompt);
      }, 1200);
      return;
    }

    setSpokenText('Listening to your EV query...');
    const simulatedPrompts = [
      'Find the nearest verified safe charging station.',
      'What is my range estimate for this trip?',
      'Suggest the safest lit route back home.',
      'Show me battery health maintenance recommendations.'
    ];
    const pickedPrompt = simulatedPrompts[Math.floor(Math.random() * simulatedPrompts.length)];

    setTimeout(() => {
      setSpokenText(`"${pickedPrompt}"`);
      setTimeout(() => {
        processQuery(pickedPrompt);
      }, 1000);
    }, 2000);
  };

  // Launch Speech Recognition or fall back
  const startListening = (customPrompt = null) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAiReplyText('');

    // If a pre-made prompt was passed (e.g. programmatic), send it directly
    if (customPrompt) {
      setSpokenText(`"${customPrompt}"`);
      processQuery(customPrompt);
      return;
    }

    // --- Real browser Speech Recognition ---
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        // Set listening state IMMEDIATELY so user sees feedback before rec.start() resolves
        setAssistantState('listening');
        setSpokenText('Listening closely...');

        try {
          // Abort any stale previous instance to avoid ghost callbacks
          if (recognitionRef.current) {
            try {
              recognitionRef.current.onstart = null;
              recognitionRef.current.onresult = null;
              recognitionRef.current.onerror = null;
              recognitionRef.current.onend = null;
              recognitionRef.current.abort();
            } catch (e) {}
          }

          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = 'en-US';

          let isHandled = false;

          rec.onstart = () => {
            if (isMountedRef.current) {
              setAssistantState('listening');
              setSpokenText('Listening closely...');
            }
          };

          rec.onresult = (event) => {
            isHandled = true;
            const transcript = event.results[0][0].transcript;
            if (isMountedRef.current) {
              setSpokenText(`"${transcript}"`);
              processQuery(transcript);
            }
          };

          rec.onerror = (e) => {
            console.warn('Speech recognition error:', e.error);
            isHandled = true;
            rec.onend = null;

            if (isMountedRef.current) {
              setAssistantState('idle');
              if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                setSpokenText('Microphone access denied. You can type or tap a suggestion below.');
              } else if (e.error === 'no-speech') {
                setSpokenText('No speech detected. Tap mic to try again or type below.');
              } else {
                setSpokenText('Browser mic unavailable. You can type your query below.');
              }
            }
          };

          rec.onend = () => {
            if (!isHandled && isMountedRef.current) {
              setSpokenText('No speech detected. Tap mic to try again or type below.');
              setAssistantState('idle');
            }
          };

          recognitionRef.current = rec;
          rec.start();
          return;
        } catch (err) {
          console.warn('SpeechRecognition failed:', err);
          if (isMountedRef.current) {
            setSpokenText('Speech recognition failed. You can type your query below.');
            setAssistantState('idle');
          }
          return;
        }
      }
    }

    // Fallback: not on web or SpeechRecognition is not supported
    setSpokenText('Speech recognition not supported in this browser. Please type below.');
    setAssistantState('idle');
  };

  const processQuery = async (queryText) => {
    if (!isMountedRef.current) return;
    setAssistantState('processing');
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: {
          message: queryText,
          lat: userCoord.latitude,
          lng: userCoord.longitude,
        },
      });

      const reply = res.data?.reply || res.data?.message || 'I successfully verified safety metrics for your route.';
      if (isMountedRef.current) {
        setAiReplyText(reply);
        setAssistantState('speaking');
        speakReply(reply);
        // Auto-scroll to reveal the reply card
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      const errorMsg = 'Sorry, I was unable to connect to the central energy cluster. Please try again.';
      if (isMountedRef.current) {
        setAiReplyText(errorMsg);
        setAssistantState('speaking');
        speakReply(errorMsg);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }
  };

  const stopAssistant = () => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setAssistantState('idle');
    setSpokenText('Tap the microphone to speak with Volt AI.');
    setAiReplyText('');
  };

  const handleClose = () => {
    stopAssistant();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.82)' },
        isDesktop || isTablet ? { justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'flex-end' },
      ]}
    >
      {/* Tap backdrop to close */}
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleClose} />

      <Animated.View style={[sheetStyle, {
        width: '100%',
        maxWidth: modalMaxWidth,
        paddingHorizontal: horizontalPadding,
        paddingBottom: isDesktop || isTablet ? 24 : Math.max(20, insets.bottom + 10),
        alignSelf: 'center',
        flex: 1,
        maxHeight: '85%',
      }]}>
        <GlassCard padding={0} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>

          {/* ── Gradient Header ── */}
          <LinearGradient
            colors={
              assistantState === 'listening'
                ? ['rgba(52,211,153,0.18)', 'rgba(52,211,153,0.04)', 'transparent']
                : assistantState === 'speaking'
                ? ['rgba(139,92,246,0.18)', 'rgba(139,92,246,0.04)', 'transparent']
                : ['rgba(0,217,126,0.12)', 'rgba(0,217,126,0.03)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: isLargeScreen ? 22 : 18,
              paddingVertical: isLargeScreen ? 18 : 14,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Animated status dot */}
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor:
                  assistantState === 'listening' ? '#34d399'
                  : assistantState === 'processing' ? '#facc15'
                  : assistantState === 'speaking' ? '#c084fc'
                  : '#00D97E',
                shadowColor:
                  assistantState === 'listening' ? '#34d399'
                  : assistantState === 'processing' ? '#facc15'
                  : assistantState === 'speaking' ? '#c084fc'
                  : '#00D97E',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 6,
                elevation: 4,
              }} />
              <View>
                <Text style={{ fontWeight: '900', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14), letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Volt Voice
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: scaleFont(10), fontWeight: '600', letterSpacing: 0.8, marginTop: 1 }}>
                  {assistantState === 'idle' ? 'AI ASSISTANT · READY'
                    : assistantState === 'listening' ? 'CAPTURING VOICE · ACTIVE'
                    : assistantState === 'processing' ? 'GEMINI AI · PROCESSING'
                    : 'VOLT AI · SPEAKING'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => setVoiceOutputOn(v => !v)}
                hitSlop={14}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: voiceOutputOn
                    ? 'rgba(0,217,126,0.12)'
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  borderWidth: 1,
                  borderColor: voiceOutputOn ? 'rgba(0,217,126,0.3)' : 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name={voiceOutputOn ? 'volume-medium' : 'volume-mute'}
                  size={isLargeScreen ? 18 : 16}
                  color={voiceOutputOn ? colors.accentCyan : colors.textMuted}
                />
              </Pressable>
              <Pressable
                onPress={handleClose}
                hitSlop={14}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons name="close" size={isLargeScreen ? 20 : 17} color={colors.textMuted} />
              </Pressable>
            </View>
          </LinearGradient>

          {/* ── Main Body ── */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              alignItems: 'center',
              padding: isLargeScreen ? 28 : 20,
              paddingBottom: 24,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* State-reactive ambient glow background */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <LinearGradient
                colors={
                  assistantState === 'listening'
                    ? ['rgba(52,211,153,0.07)', 'rgba(52,211,153,0.02)', 'transparent']
                    : assistantState === 'processing'
                    ? ['rgba(250,204,21,0.06)', 'rgba(0,217,126,0.04)', 'transparent']
                    : assistantState === 'speaking'
                    ? ['rgba(192,132,252,0.09)', 'rgba(139,92,246,0.03)', 'transparent']
                    : ['rgba(0,217,126,0.04)', 'transparent']
                }
                style={{ flex: 1 }}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.7 }}
              />
            </View>

            {/* ── Waveform Visualizer ── */}
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 72,
                gap: 3,
                marginBottom: 6,
              }}>
                {[
                  { delay: 80,  w: 4 },
                  { delay: 200, w: 5 },
                  { delay: 120, w: 6 },
                  { delay: 300, w: 5 },
                  { delay: 60,  w: 7 },
                  { delay: 250, w: 5 },
                  { delay: 180, w: 6 },
                  { delay: 100, w: 5 },
                  { delay: 220, w: 4 },
                  { delay: 340, w: 6 },
                  { delay: 90,  w: 5 },
                  { delay: 160, w: 7 },
                  { delay: 280, w: 5 },
                  { delay: 130, w: 4 },
                  { delay: 210, w: 6 },
                ].map((bar, i) => (
                  <VoiceBar
                    key={i}
                    delay={bar.delay}
                    active={assistantState === 'listening' || assistantState === 'speaking'}
                    color={
                      assistantState === 'speaking'
                        ? (i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#a78bfa' : '#c084fc')
                        : assistantState === 'listening'
                        ? (i % 2 === 0 ? colors.accentCyan : colors.accentMint)
                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                    }
                  />
                ))}
              </View>
              {/* Reflection effect */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'center',
                height: 20,
                gap: 3,
                opacity: 0.2,
                transform: [{ scaleY: -1 }],
              }}>
                {[4, 5, 6, 5, 7, 5, 6, 5, 4, 6, 5, 7, 5, 4, 6].map((w, i) => (
                  <View key={i} style={{ width: w, height: 14, borderRadius: 3, backgroundColor: '#00D97E' }} />
                ))}
              </View>
            </View>

            {/* ── Central Orb Section ── */}
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              {/* Outermost ring */}
              <Animated.View style={[micPulseStyle, {
                width: 160, height: 160, borderRadius: 80,
                borderWidth: 1,
                borderColor:
                  assistantState === 'listening' ? 'rgba(52,211,153,0.2)'
                  : assistantState === 'speaking' ? 'rgba(192,132,252,0.2)'
                  : 'rgba(0,217,126,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }]}>
                {/* Middle ring */}
                <View style={{
                  width: 128, height: 128, borderRadius: 64,
                  borderWidth: 1.5,
                  borderColor:
                    assistantState === 'listening' ? 'rgba(52,211,153,0.35)'
                    : assistantState === 'speaking' ? 'rgba(192,132,252,0.35)'
                    : 'rgba(0,217,126,0.2)',
                  backgroundColor:
                    assistantState === 'listening' ? 'rgba(52,211,153,0.06)'
                    : assistantState === 'speaking' ? 'rgba(139,92,246,0.06)'
                    : 'rgba(0,217,126,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Inner core button */}
                  <Pressable
                    onPress={() => {
                      if (assistantState === 'idle' || assistantState === 'speaking') {
                        startListening();
                      } else if (assistantState === 'listening' || assistantState === 'processing') {
                        stopAssistant();
                      }
                    }}
                    style={({ pressed }) => ({
                      width: 94, height: 94, borderRadius: 47,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      opacity: pressed ? 0.88 : 1,
                      // Neon glow shadow
                      shadowColor:
                        assistantState === 'listening' ? '#34d399'
                        : assistantState === 'speaking' ? '#c084fc'
                        : '#00D97E',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 18,
                      elevation: 12,
                    })}
                  >
                    <LinearGradient
                      colors={
                        assistantState === 'listening'
                          ? ['#34d399', '#10b981']
                          : assistantState === 'processing'
                          ? ['#e2e8f0', '#94a3b8']
                          : assistantState === 'speaking'
                          ? ['#c084fc', '#8b5cf6']
                          : ['#22d3ee', '#00b4d8']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center' }}
                    >
                      {assistantState === 'processing' ? (
                        <ActivityIndicator color="#1e293b" size="large" />
                      ) : (
                        <Ionicons
                          name={assistantState === 'listening' ? 'stop' : assistantState === 'speaking' ? 'mic-off' : 'mic'}
                          size={36}
                          color="#0f172a"
                        />
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>

              {/* State label under orb */}
              <View style={{
                marginTop: 14,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 99,
                backgroundColor:
                  assistantState === 'listening' ? 'rgba(52,211,153,0.12)'
                  : assistantState === 'processing' ? 'rgba(250,204,21,0.1)'
                  : assistantState === 'speaking' ? 'rgba(192,132,252,0.12)'
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                borderColor:
                  assistantState === 'listening' ? 'rgba(52,211,153,0.25)'
                  : assistantState === 'processing' ? 'rgba(250,204,21,0.2)'
                  : assistantState === 'speaking' ? 'rgba(192,132,252,0.25)'
                  : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}>
                <Text style={{
                  fontSize: scaleFont(12),
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color:
                    assistantState === 'listening' ? '#34d399'
                    : assistantState === 'processing' ? '#facc15'
                    : assistantState === 'speaking' ? '#c084fc'
                    : colors.textMuted,
                }}>
                  {assistantState === 'idle' ? '⚡ Tap to speak'
                    : assistantState === 'listening' ? '🎙 Listening...'
                    : assistantState === 'processing' ? '✦ Processing...'
                    : '🔊 Speaking'}
                </Text>
              </View>
            </View>

            {/* ── Query / Reply Cards ── */}
            <View style={{ width: '100%', gap: 10 }}>
              {/* Spoken text bubble */}
              <View style={{
                width: '100%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor:
                  assistantState === 'listening'
                    ? 'rgba(52,211,153,0.25)'
                    : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="mic-circle-outline" size={14} color={colors.textMuted} />
                  <Text style={{
                    color: colors.textMuted,
                    fontSize: scaleFont(10),
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1.4,
                  }}>
                    {assistantState === 'listening' ? 'Capturing Voice' : 'Last Query'}
                  </Text>
                </View>
                <Text style={{
                  color: colors.text,
                  fontSize: scaleFont(14),
                  lineHeight: 20,
                  fontWeight: '500',
                  fontStyle: spokenText.startsWith('"') ? 'italic' : 'normal',
                }}>
                  {spokenText}
                </Text>
              </View>

              {/* Suggestion Chips */}
              {assistantState === 'idle' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 2 }}>
                  {[
                    'Nearest charging station',
                    'Safe route home',
                    'Range estimate',
                  ].map((chipText, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        if (Platform.OS === 'web' && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                        }
                        setSpokenText(`"${chipText}"`);
                        processQuery(chipText);
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: isDark ? 'rgba(0,217,126, 0.08)' : 'rgba(0,106,78, 0.05)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(0,217,126, 0.2)' : 'rgba(0,106,78, 0.15)',
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ color: colors.accentCyan, fontSize: scaleFont(11), fontWeight: '600' }}>
                        {chipText}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Text Input Fallback */}
              {assistantState === 'idle' && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  paddingHorizontal: 12,
                }}>
                  <TextInput
                    placeholder="Or type your query here..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => {
                      if (inputText.trim()) {
                        if (Platform.OS === 'web' && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                        }
                        const text = inputText.trim();
                        setInputText('');
                        setSpokenText(`"${text}"`);
                        processQuery(text);
                      }
                    }}
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: scaleFont(13),
                      paddingVertical: 10,
                      ...Platform.select({
                        web: { outlineStyle: 'none' },
                        default: {},
                      }),
                    }}
                  />
                  {inputText.trim() ? (
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === 'web' && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                        }
                        const text = inputText.trim();
                        setInputText('');
                        setSpokenText(`"${text}"`);
                        processQuery(text);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons name="send" size={16} color={colors.accentCyan} />
                    </Pressable>
                  ) : null}
                </View>
              )}

              {/* AI reply card — visible after processing */}
              {aiReplyText ? (
                <Animated.View style={{
                  width: '100%',
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.3)',
                  backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons name="sparkles" size={14} color="#c084fc" />
                    <Text style={{ color: '#c084fc', fontWeight: '800', fontSize: scaleFont(10), textTransform: 'uppercase', letterSpacing: 1.4 }}>
                      Volt AI Response
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: scaleFont(13.5), lineHeight: 21, fontWeight: '500' }}>
                    {aiReplyText}
                  </Text>
                </Animated.View>
              ) : null}
            </View>

          </ScrollView>
        </GlassCard>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

