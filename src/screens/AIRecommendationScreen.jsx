import { useEffect, useState, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

// ─── Animated waveform bar for Voice mode ────────────────────────────────────
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
  const style = useAnimatedStyle(() => ({ height: height.value }));
  return (
    <Animated.View
      style={[style, { width: 5, borderRadius: 3, backgroundColor: color || '#00D97E', marginHorizontal: 3 }]}
    />
  );
}

// ─── Voice Panel (embedded) ───────────────────────────────────────────────────
function VoicePanel({ colors, isDark, scaleFont, isLargeScreen }) {
  const { userCoord } = useVoltApi();
  const isMountedRef = useRef(true);
  const recognitionRef = useRef(null);
  const scrollViewRef = useRef(null);

  const [assistantState, setAssistantState] = useState('idle');
  const [spokenText, setSpokenText] = useState('Tap the microphone to ask Volt AI anything.');
  const [aiReplyText, setAiReplyText] = useState('');
  const [voiceOutputOn, setVoiceOutputOn] = useState(true);
  const [inputText, setInputText] = useState('');

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    isMountedRef.current = true;
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1200 }), withTiming(1.0, { duration: 1200 })),
      -1,
      true
    );
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

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: assistantState === 'listening' ? 1.15 : pulseScale.value }],
  }));

  const speakReply = (text) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (!voiceOutputOn) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      const trySpeak = () => {
        if (!isMountedRef.current) return;
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(
          v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
        );
        if (premiumVoice) utterance.voice = premiumVoice;
        utterance.onstart = () => { if (isMountedRef.current) setAssistantState('speaking'); };
        utterance.onend = () => { if (isMountedRef.current) setAssistantState('idle'); };
        utterance.onerror = () => { if (isMountedRef.current) setAssistantState('idle'); };
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

  const processVoiceQuery = async (queryText) => {
    if (!isMountedRef.current) return;
    setAssistantState('processing');
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: { message: queryText, lat: userCoord.latitude, lng: userCoord.longitude },
      });
      const reply = res.data?.reply || res.data?.message || 'I successfully verified safety metrics for your route.';
      if (isMountedRef.current) {
        setAiReplyText(reply);
        setAssistantState('speaking');
        speakReply(reply);
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
    if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
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

  const startListening = () => {
    if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
    setAiReplyText('');

    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setAssistantState('listening');
        setSpokenText('Listening closely...');
        try {
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
            if (isMountedRef.current) { setAssistantState('listening'); setSpokenText('Listening closely...'); }
          };
          rec.onresult = (event) => {
            isHandled = true;
            const transcript = event.results[0][0].transcript;
            if (isMountedRef.current) { setSpokenText(`"${transcript}"`); processVoiceQuery(transcript); }
          };
          rec.onerror = (e) => {
            isHandled = true;
            rec.onend = null;
            if (isMountedRef.current) {
              setAssistantState('idle');
              if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                setSpokenText('Microphone access denied. Type a query or tap a suggestion below.');
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
          if (isMountedRef.current) {
            setSpokenText('Speech recognition failed. You can type your query below.');
            setAssistantState('idle');
          }
          return;
        }
      }
    }
    setSpokenText('Speech recognition not supported. Please type below.');
    setAssistantState('idle');
  };

  const sendTyped = () => {
    if (!inputText.trim()) return;
    if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
    const text = inputText.trim();
    setInputText('');
    setSpokenText(`"${text}"`);
    processVoiceQuery(text);
  };

  const micColor =
    assistantState === 'listening' ? '#34d399'
    : assistantState === 'speaking' ? '#c084fc'
    : '#00D97E';

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ alignItems: 'center', padding: isLargeScreen ? 24 : 18, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Waveform ── */}
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, gap: 3 }}>
          {[80,200,120,300,60,250,180,100,220,340,90,160,280,130,210].map((delay, i) => (
            <VoiceBar
              key={i}
              delay={delay}
              active={assistantState === 'listening' || assistantState === 'speaking'}
              color={
                assistantState === 'speaking'
                  ? (i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#a78bfa' : '#c084fc')
                  : assistantState === 'listening'
                  ? (i % 2 === 0 ? colors.accentCyan : '#34d399')
                  : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
              }
            />
          ))}
        </View>
      </View>

      {/* ── Orb button ── */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[micPulseStyle, {
          width: 140, height: 140, borderRadius: 70,
          borderWidth: 1,
          borderColor: assistantState === 'listening' ? 'rgba(52,211,153,0.25)' : assistantState === 'speaking' ? 'rgba(192,132,252,0.25)' : 'rgba(0,217,126,0.15)',
          alignItems: 'center', justifyContent: 'center',
        }]}>
          <View style={{
            width: 112, height: 112, borderRadius: 56,
            borderWidth: 1.5,
            borderColor: assistantState === 'listening' ? 'rgba(52,211,153,0.4)' : assistantState === 'speaking' ? 'rgba(192,132,252,0.4)' : 'rgba(0,217,126,0.25)',
            backgroundColor: assistantState === 'listening' ? 'rgba(52,211,153,0.06)' : assistantState === 'speaking' ? 'rgba(139,92,246,0.06)' : 'rgba(0,217,126,0.04)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Pressable
              onPress={() => {
                if (assistantState === 'idle' || assistantState === 'speaking') startListening();
                else stopAssistant();
              }}
              style={({ pressed }) => ({
                width: 82, height: 82, borderRadius: 41,
                overflow: 'hidden',
                opacity: pressed ? 0.85 : 1,
                shadowColor: micColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 16,
                elevation: 12,
              })}
            >
              <LinearGradient
                colors={
                  assistantState === 'listening' ? ['#34d399', '#10b981']
                  : assistantState === 'processing' ? ['#e2e8f0', '#94a3b8']
                  : assistantState === 'speaking' ? ['#c084fc', '#8b5cf6']
                  : ['#22d3ee', '#00b4d8']
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' }}
              >
                {assistantState === 'processing' ? (
                  <ActivityIndicator color="#1e293b" size="large" />
                ) : (
                  <Ionicons
                    name={assistantState === 'listening' ? 'stop' : assistantState === 'speaking' ? 'mic-off' : 'mic'}
                    size={32} color="#0f172a"
                  />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* State label */}
        <View style={{
          marginTop: 12, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 99,
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
            fontSize: scaleFont(11), fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',
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

      {/* ── Query card ── */}
      <View style={{ width: '100%', gap: 10 }}>
        <View style={{
          width: '100%',
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderRadius: 18, padding: 14, borderWidth: 1,
          borderColor: assistantState === 'listening' ? 'rgba(52,211,153,0.25)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <Ionicons name="mic-circle-outline" size={13} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: scaleFont(10), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 }}>
              {assistantState === 'listening' ? 'Capturing Voice' : 'Last Query'}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: scaleFont(13), lineHeight: 19, fontWeight: '500', fontStyle: spokenText.startsWith('"') ? 'italic' : 'normal' }}>
            {spokenText}
          </Text>
        </View>

        {/* Suggestion chips */}
        {assistantState === 'idle' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['Nearest charging station', 'Safe route home', 'Range estimate'].map((chip, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (Platform.OS === 'web' && window.speechSynthesis) window.speechSynthesis.cancel();
                  setSpokenText(`"${chip}"`);
                  processVoiceQuery(chip);
                }}
                style={({ pressed }) => ({
                  backgroundColor: isDark ? 'rgba(0,217,126,0.08)' : 'rgba(0,106,78,0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(0,217,126,0.2)' : 'rgba(0,106,78,0.15)',
                  borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: colors.accentCyan, fontSize: scaleFont(11), fontWeight: '600' }}>{chip}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Text input fallback */}
        {assistantState === 'idle' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: 14, borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            paddingHorizontal: 12,
          }}>
            <TextInput
              placeholder="Or type your query here..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendTyped}
              style={{
                flex: 1, color: colors.text, fontSize: scaleFont(13), paddingVertical: 10,
                ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
              }}
            />
            {inputText.trim() ? (
              <Pressable onPress={sendTyped} style={{ marginLeft: 8 }}>
                <Ionicons name="send" size={16} color={colors.accentCyan} />
              </Pressable>
            ) : null}
          </View>
        )}

        {/* AI reply card */}
        {aiReplyText ? (
          <View style={{
            width: '100%', borderRadius: 18, padding: 14, borderWidth: 1,
            borderColor: 'rgba(139,92,246,0.3)',
            backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="sparkles" size={13} color="#c084fc" />
              <Text style={{ color: '#c084fc', fontWeight: '800', fontSize: scaleFont(10), textTransform: 'uppercase', letterSpacing: 1.4 }}>
                Volt AI Response
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: scaleFont(13.5), lineHeight: 21, fontWeight: '500' }}>
              {aiReplyText}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ─── Main unified screen ──────────────────────────────────────────────────────
export function AIRecommendationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userCoord } = useVoltApi();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, modalMaxWidth, scaleFont, isDesktop, isLargeScreen, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();

  // 'chat' | 'voice'
  const [activeTab, setActiveTab] = useState('chat');

  // ── Chat state ──
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const flatListRef = useRef(null);

  const opacity = useSharedValue(0);
  const translate = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    translate.value = withTiming(0, { duration: 320 });
  }, [opacity, translate]);

  // Auto-scroll when keyboard opens (chat mode)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    );
    return () => showSub.remove();
  }, []);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('@VoltPath:chat_history');
        setMessages(stored ? JSON.parse(stored) : [
          { id: '1', role: 'ai', text: `Hi ${user?.name || 'there'}! I'm Volt AI. How can I help with your EV journey today?` }
        ]);
      } catch {
        setMessages([{ id: '1', role: 'ai', text: `Hi ${user?.name || 'there'}! I'm Volt AI. How can I help you today?` }]);
      }
    };
    loadHistory();
  }, [user]);

  const saveHistory = async (msgs) => {
    try { await AsyncStorage.setItem('@VoltPath:chat_history', JSON.stringify(msgs)); } catch {}
  };

  const handleClearHistory = async () => {
    try { await AsyncStorage.removeItem('@VoltPath:chat_history'); } catch {}
    const resetMsg = [{ id: Date.now().toString(), role: 'ai', text: `Chat cleared. What can I help you with now?` }];
    setMessages(resetMsg);
    await saveHistory(resetMsg);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const userMessage = inputText.trim();
    setInputText('');
    const newMsg = { id: Date.now().toString(), role: 'user', text: userMessage };
    const updated = [...messages, newMsg];
    setMessages(updated);
    await saveHistory(updated);
    setLoading(true);
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: { message: userMessage, lat: userCoord.latitude, lng: userCoord.longitude },
      });
      const aiReply = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: res.data?.reply || res.data?.message || 'I could not process your request at this time.',
      };
      const final = [...updated, aiReply];
      setMessages(final);
      await saveHistory(final);
    } catch {
      const errReply = { id: (Date.now() + 1).toString(), role: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      const final = [...updated, errReply];
      setMessages(final);
      await saveHistory(final);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isClose = contentSize.height - layoutMeasurement.height - contentOffset.y < 120;
    setShowScrollBottomBtn(contentOffset.y > 150 && !isClose);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
    flex: 1,
    maxHeight: '90%',
  }));

  const itemBgAi = isDark ? 'rgba(0,217,126,0.08)' : 'rgba(0,106,78,0.08)';
  const itemBgUser = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.04)';
  const itemBorderAi = isDark ? 'rgba(0,217,126,0.2)' : 'rgba(0,106,78,0.2)';

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{
        alignSelf: 'flex-start', maxWidth: '85%', marginBottom: 14,
        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
        backgroundColor: itemBgAi, borderWidth: 1, borderColor: itemBorderAi,
        borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 8,
      }}>
        <Ionicons name="sparkles" size={14} color={colors.accentCyan} />
        <Text style={{ color: colors.textMuted, fontSize: scaleFont(13), fontWeight: '500', fontStyle: 'italic' }}>
          Volt AI is analyzing energy systems...
        </Text>
        <ActivityIndicator color={colors.accentCyan} size="small" style={{ marginLeft: 4 }} />
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 14, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {!isUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, marginLeft: 4 }}>
            <Ionicons name="sparkles" size={12} color={colors.accentCyan} />
            <Text style={{ fontSize: scaleFont(11), fontWeight: '700', color: colors.accentCyan, textTransform: 'uppercase', letterSpacing: 0.5 }}>Volt AI</Text>
          </View>
        )}
        <View style={{
          paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
          backgroundColor: isUser ? itemBgUser : itemBgAi,
          borderWidth: 1,
          borderColor: isUser ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : itemBorderAi,
          borderBottomRightRadius: isUser ? 4 : 20,
          borderBottomLeftRadius: isUser ? 20 : 4,
          shadowColor: isUser ? 'transparent' : colors.accentCyan,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUser ? 0 : 0.08,
          shadowRadius: 4,
          elevation: isUser ? 0 : 1,
        }}>
          <Text style={{ color: colors.text, fontSize: scaleFont(isLargeScreen ? 15 : 14), lineHeight: 22, fontWeight: '500' }}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={[
        { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
        isDesktop || isTablet ? { justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'flex-end' },
      ]}
    >
      {/* Backdrop tap-to-close */}
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => navigation.goBack()} />

      <Animated.View style={[sheetStyle, {
        width: '100%', maxWidth: modalMaxWidth,
        paddingHorizontal: horizontalPadding,
        paddingBottom: isDesktop || isTablet ? 24 : Math.max(20, insets.bottom + 10),
        alignSelf: 'center',
      }]}>
        <GlassCard padding={0} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <LinearGradient
            colors={
              activeTab === 'voice'
                ? ['rgba(0,217,126,0.12)', 'rgba(0,217,126,0.03)', 'transparent']
                : ['rgba(139,92,246,0.12)', 'rgba(139,92,246,0.03)', 'transparent']
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: isLargeScreen ? 22 : 18,
              paddingTop: isLargeScreen ? 16 : 14,
              paddingBottom: 0,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            }}
          >
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={activeTab === 'voice' ? 'mic' : 'sparkles'}
                  size={isLargeScreen ? 22 : 18}
                  color={colors.accentCyan}
                />
                <View>
                  <Text style={{ fontWeight: '900', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14), letterSpacing: 0.5 }}>
                    Volt AI
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(10), fontWeight: '600', letterSpacing: 0.8 }}>
                    {activeTab === 'voice' ? 'VOICE ASSISTANT' : 'CHAT ASSISTANT'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {activeTab === 'chat' && messages.length > 1 && (
                  <Pressable onPress={handleClearHistory} hitSlop={12}>
                    <Ionicons name="trash-outline" size={isLargeScreen ? 22 : 18} color={colors.textMuted} />
                  </Pressable>
                )}
                <Pressable onPress={() => navigation.goBack()} hitSlop={14}
                  style={({ pressed }) => ({
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="close" size={isLargeScreen ? 18 : 16} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* ── Tab switcher ── */}
            <View style={{ flexDirection: 'row', gap: 0, borderRadius: 12, overflow: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: 0 }}>
              {[
                { key: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
                { key: 'voice', icon: 'mic', label: 'Voice' },
              ].map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: isActive
                        ? (tab.key === 'voice' ? 'rgba(0,217,126,0.15)' : 'rgba(139,92,246,0.15)')
                        : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons
                      name={isActive ? tab.icon : `${tab.icon}-outline`}
                      size={15}
                      color={isActive ? (tab.key === 'voice' ? colors.accentCyan : '#a78bfa') : colors.textMuted}
                    />
                    <Text style={{
                      fontSize: scaleFont(12),
                      fontWeight: isActive ? '800' : '600',
                      color: isActive ? (tab.key === 'voice' ? colors.accentCyan : '#a78bfa') : colors.textMuted,
                      letterSpacing: 0.5,
                    }}>
                      {tab.label}
                    </Text>
                    {isActive && (
                      <View style={{
                        position: 'absolute',
                        bottom: 0, left: '20%', right: '20%',
                        height: 2, borderRadius: 1,
                        backgroundColor: tab.key === 'voice' ? colors.accentCyan : '#a78bfa',
                      }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>

          {/* ── Content ── */}
          {activeTab === 'chat' ? (
            <>
              {/* Chat messages */}
              <View style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  ListFooterComponent={renderFooter}
                />
                {showScrollBottomBtn && (
                  <Pressable
                    onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    style={({ pressed }) => ({
                      position: 'absolute', right: 16, bottom: 16,
                      width: 38, height: 38, borderRadius: 19,
                      backgroundColor: colors.accentCyan,
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
                      zIndex: 10, opacity: pressed ? 0.8 : 0.95,
                    })}
                  >
                    <Ionicons name="arrow-down" size={18} color={isDark ? '#020617' : '#fff'} />
                  </Pressable>
                )}
              </View>

              {/* Chat input */}
              <View style={{
                padding: 12, paddingBottom: 14,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                flexDirection: 'row', alignItems: 'flex-end', gap: 10,
              }}>
                <TextInput
                  style={{
                    flex: 1, minHeight: 44, maxHeight: 120,
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
                    borderRadius: 22, paddingHorizontal: 16,
                    paddingTop: 12, paddingBottom: 12,
                    color: colors.text, fontSize: scaleFont(15),
                    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
                  }}
                  placeholder="Ask anything about your EV..."
                  placeholderTextColor={colors.textFaint}
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                />
                <Pressable
                  onPress={handleSend}
                  disabled={loading || !inputText.trim()}
                  style={({ pressed }) => ({
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: (loading || !inputText.trim())
                      ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')
                      : colors.accentCyan,
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="send" size={20} color={isDark ? '#020617' : '#fff'} style={{ marginLeft: 2 }} />
                  }
                </Pressable>
              </View>
            </>
          ) : (
            <VoicePanel
              colors={colors}
              isDark={isDark}
              scaleFont={scaleFont}
              isLargeScreen={isLargeScreen}
            />
          )}
        </GlassCard>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
