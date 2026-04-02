import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AthleteProvider, useAthlete } from "@/context/AthleteContext";
import { WorkoutProvider } from "@/context/WorkoutContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <View style={ls.container}>
      <Image
        source={require("../assets/images/ironpulse-logo.png")}
        style={ls.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color="#00D4FF" size="large" style={{ marginTop: 24 }} />
      <Text style={ls.text}>Fortschritte werden geladen…</Text>
    </View>
  );
}

function RestoreFailedScreen({ onRetry }: { onRetry: () => void }) {
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <View style={[ls.container, { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 32 }]}>
      <Image
        source={require("../assets/images/ironpulse-logo.png")}
        style={ls.logo}
        resizeMode="contain"
      />
      <View style={ls.iconWrap}>
        <Text style={ls.wifiIcon}>📡</Text>
      </View>
      <Text style={ls.failTitle}>Verbindung unterbrochen</Text>
      <Text style={ls.failDesc}>
        Deine Daten sind sicher auf dem Server gespeichert. Stelle sicher, dass du mit dem Internet verbunden bist und versuche es erneut.
      </Text>
      <TouchableOpacity
        style={[ls.retryBtn, retrying && ls.retryBtnDisabled]}
        onPress={handleRetry}
        disabled={retrying}
        activeOpacity={0.8}
      >
        {retrying ? (
          <ActivityIndicator color="#0d0d0f" size="small" />
        ) : (
          <Text style={ls.retryText}>Erneut versuchen</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={ls.skipBtn}
        onPress={() => router.replace("/onboarding")}
        activeOpacity={0.7}
      >
        <Text style={ls.skipText}>Als neuer Nutzer starten</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutNav() {
  const { profile, isLoading, restoreFailed, retryRestore } = useAthlete();
  const didNavigate = useRef(false);

  useEffect(() => {
    if (isLoading || restoreFailed) return;
    if (didNavigate.current) return;
    didNavigate.current = true;
    if (!profile) {
      router.replace("/onboarding");
    }
  }, [isLoading, restoreFailed, profile]);

  if (isLoading) return <LoadingScreen />;
  if (restoreFailed) return <RestoreFailedScreen onRetry={retryRestore} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="workout" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="premium" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
    </Stack>
  );
}

const ls = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: { width: 140, height: 140 },
  text: {
    marginTop: 16,
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
  },
  iconWrap: { marginTop: 12, marginBottom: 4 },
  wifiIcon: { fontSize: 40 },
  failTitle: {
    marginTop: 8,
    color: "#f9fafb",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  failDesc: {
    marginTop: 12,
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 32,
    width: "100%",
    backgroundColor: "#00D4FF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnDisabled: { opacity: 0.6 },
  retryText: {
    color: "#0d0d0f",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  skipBtn: { marginTop: 16, padding: 12 },
  skipText: {
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#0d0d0f");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AthleteProvider>
            <WorkoutProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </WorkoutProvider>
          </AthleteProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
