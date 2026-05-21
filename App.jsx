import React, { Component } from 'react';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, ScrollView, Text, Pressable, Platform } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { VoltDataProvider } from './src/context/VoltDataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RootErrorBoundary caught rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const colors = {
        bg: '#020617',
        bgElevated: '#0a1628',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        accentCyan: '#00d4ff',
        danger: '#fb7185',
        border: 'rgba(0, 212, 255, 0.22)',
      };

      return (
        <View style={[styles.errorRoot, { backgroundColor: colors.bg }]}>
          <View style={[styles.errorContainer, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <Text style={[styles.errorTitle, { color: colors.accentCyan }]}>VoltPath Diagnostics</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
              The application encountered a critical rendering error.
            </Text>
            
            <View style={[styles.errorCard, { borderColor: colors.danger + '33' }]}>
              <Text style={[styles.errorLabel, { color: colors.danger }]}>Error Message</Text>
              <Text style={[styles.errorMessage, { color: colors.text }]}>
                {this.state.error?.toString() || 'Unknown Error'}
              </Text>
            </View>

            {this.state.errorInfo?.componentStack ? (
              <View style={styles.stackContainer}>
                <Text style={[styles.errorLabel, { color: colors.textMuted }]}>Stack Trace</Text>
                <ScrollView style={styles.stackScroll} showsVerticalScrollIndicator={true}>
                  <Text style={[styles.stackText, { color: colors.textMuted }]}>
                    {this.state.errorInfo.componentStack.trim()}
                  </Text>
                </ScrollView>
              </View>
            ) : null}

            <Pressable
              onPress={this.handleRestart}
              style={({ pressed }) => [
                styles.errorBtn,
                { backgroundColor: colors.accentCyan, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text style={styles.errorBtnText}>Clear Storage & Restart</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}


/** Inner shell — reads theme after ThemeProvider is mounted */
function AppShell() {
  const { isDark, colors } = useTheme();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.bgElevated,
          text: colors.text,
          border: colors.border,
          primary: colors.accentCyan,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.bgElevated,
          text: colors.text,
          border: colors.border,
          primary: colors.accentCyan,
        },
      };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <VoltDataProvider>
                <AppShell />
              </VoltDataProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  errorCard: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(251, 113, 133, 0.05)',
    padding: 16,
    marginBottom: 16,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  stackContainer: {
    flex: 1,
    maxHeight: 180,
    marginBottom: 20,
  },
  stackScroll: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  stackText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  errorBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBtnText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 14,
  },
});
