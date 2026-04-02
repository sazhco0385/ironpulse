import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AppIcon } from "./AppIcon";
import { ProgressBar } from "./ProgressBar";
import { useColors } from "@/hooks/useColors";

// ── Web beep (Web Audio API) ────────────────────────────────────────────────
function playBeepWeb() {
  if (Platform.OS !== "web") return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playTone(523, 0, 0.12);
    playTone(659, 0.14, 0.12);
    playTone(784, 0.28, 0.25);
  } catch {}
}

// ── Native beep (expo-av) ───────────────────────────────────────────────────
// Lazy-load expo-av so web bundle is not affected
let _Audio: any = null;
async function getAudio() {
  if (!_Audio) {
    try {
      const mod = await import("expo-av");
      _Audio = mod.Audio;
    } catch {}
  }
  return _Audio;
}

async function playBeepNative() {
  if (Platform.OS === "web") return;
  try {
    const Audio = await getAudio();
    if (!Audio) return;
    // Allow sound to play even in silent mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/sounds/rest_done.wav"),
      { shouldPlay: true, volume: 1.0 },
    );
    // Unload after playback to free memory (~400ms)
    setTimeout(() => sound.unloadAsync().catch(() => {}), 800);
  } catch (e) {
    // Fallback: at least vibrate
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

type Props = {
  defaultSeconds?: number;
  autoStartTrigger?: number;
};

export function RestTimer({ defaultSeconds = 90, autoStartTrigger = 0 }: Props) {
  const colors = useColors();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [total, setTotal] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opacity = useSharedValue(0);
  const glow = useSharedValue(1);
  const prevTriggerRef = useRef(0);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    shadowOpacity: glow.value - 1,
  }));

  const stop = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    opacity.value = withTiming(0, { duration: 300 });
    glow.value = withTiming(1, { duration: 200 });
  }, []);

  const start = useCallback(
    (secs?: number) => {
      const t = secs ?? defaultSeconds;
      setTotal(t);
      setSeconds(t);
      setIsRunning(true);
      opacity.value = withSpring(1);
    },
    [defaultSeconds],
  );

  useEffect(() => {
    if (autoStartTrigger > 0 && autoStartTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = autoStartTrigger;
      start(defaultSeconds);
    }
  }, [autoStartTrigger, defaultSeconds, start]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            stop();
            if (Platform.OS === "web") {
              playBeepWeb();
            } else {
              playBeepNative(); // plays sound + acts as haptic fallback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            glow.value = withSequence(
              withTiming(1.04, { duration: 120 }),
              withTiming(1, { duration: 120 }),
              withTiming(1.04, { duration: 120 }),
              withTiming(1, { duration: 120 }),
            );
            return 0;
          }
          if (prev <= 4) {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, stop]);

  const progress = total > 0 ? seconds / total : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 10 && isRunning;

  return (
    <View style={styles.wrapper}>
      {!isRunning && seconds === 0 && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.presets}>
          {[60, 90, 120, 180].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => start(s)}
              style={[
                styles.presetBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: colors.radius / 2,
                },
              ]}
            >
              <Text style={[styles.presetText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? `${s % 60}s` : ""}` : `${s}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {(isRunning || seconds > 0) && (
        <Animated.View
          style={[
            animStyle,
            styles.timer,
            {
              backgroundColor: isUrgent ? colors.accent + "18" : colors.secondary,
              borderColor: isUrgent ? colors.accent + "66" : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.timerRow}>
            <View style={styles.timerLeft}>
              <AppIcon name="clock" size={14} color={isUrgent ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.timerLabel, { color: isUrgent ? colors.accent : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Pause
              </Text>
            </View>
            <Animated.Text
              style={[
                glowStyle,
                styles.timerText,
                { color: isUrgent ? colors.accent : colors.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              {mins}:{secs.toString().padStart(2, "0")}
            </Animated.Text>
            <TouchableOpacity
              onPress={stop}
              style={[styles.stopBtn, { backgroundColor: colors.muted, borderRadius: 15 }]}
            >
              <AppIcon name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ProgressBar
            progress={progress}
            color={isUrgent ? colors.accent : progress < 0.35 ? colors.success : progress < 0.7 ? colors.primary : colors.accent}
            height={5}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  presets: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  presetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  presetText: { fontSize: 12 },
  timer: { padding: 12, borderWidth: 1, gap: 10 },
  timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  timerLabel: { fontSize: 12 },
  timerText: { fontSize: 30, letterSpacing: -1 },
  stopBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
});
