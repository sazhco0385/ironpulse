import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const CYAN = "#00D4FF";
const ORANGE = "#FF6B35";

type PDef = {
  id: number;
  x: number;
  y: number;
  size: number;
  cyan: boolean;
  duration: number;
  delay: number;
  drift: number;
  maxOpacity: number;
};

const PARTICLES: PDef[] = [
  { id: 0, x: W * 0.12, y: H * 0.72, size: 4,   cyan: true,  duration: 7000,  delay: 0,    drift: 18,  maxOpacity: 0.55 },
  { id: 1, x: W * 0.80, y: H * 0.60, size: 3,   cyan: false, duration: 9000,  delay: 800,  drift: -14, maxOpacity: 0.45 },
  { id: 2, x: W * 0.50, y: H * 0.78, size: 5,   cyan: true,  duration: 8000,  delay: 400,  drift: -20, maxOpacity: 0.60 },
  { id: 3, x: W * 0.30, y: H * 0.50, size: 2.5, cyan: false, duration: 10000, delay: 1200, drift: 12,  maxOpacity: 0.40 },
  { id: 4, x: W * 0.70, y: H * 0.82, size: 3.5, cyan: true,  duration: 6500,  delay: 200,  drift: -16, maxOpacity: 0.50 },
  { id: 5, x: W * 0.90, y: H * 0.40, size: 2,   cyan: false, duration: 11000, delay: 1600, drift: 10,  maxOpacity: 0.35 },
  { id: 6, x: W * 0.20, y: H * 0.35, size: 3,   cyan: true,  duration: 9500,  delay: 600,  drift: 22,  maxOpacity: 0.45 },
  { id: 7, x: W * 0.60, y: H * 0.65, size: 4.5, cyan: false, duration: 7500,  delay: 1000, drift: -18, maxOpacity: 0.55 },
];

function FloatingDot({ p }: { p: PDef }) {
  const color = p.cyan ? CYAN : ORANGE;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(translateY, { toValue: -H * 0.50, duration: p.duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    const sway = Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(translateX, { toValue: p.drift, duration: p.duration / 2, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: p.duration / 2, useNativeDriver: true }),
      ]),
    );

    const fade = Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(opacity, { toValue: p.maxOpacity, duration: p.duration * 0.15, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: p.maxOpacity * 0.8, duration: p.duration * 0.55, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: p.duration * 0.30, useNativeDriver: true }),
      ]),
    );

    rise.start();
    sway.start();
    fade.start();

    return () => {
      rise.stop();
      sway.stop();
      fade.stop();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        width: p.size,
        height: p.size,
        borderRadius: p.size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: p.size * 3,
        shadowOffset: { width: 0, height: 0 },
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

function TopGlow() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.20] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <Animated.View
      style={[styles.topGlow, { opacity, transform: [{ scale }] }]}
    />
  );
}

function BottomGlow() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });

  return (
    <Animated.View
      style={[styles.bottomGlow, { opacity, transform: [{ scale }] }]}
    />
  );
}

function ScanLine() {
  const translateY = useRef(new Animated.Value(-10)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const move = Animated.loop(
      Animated.timing(translateY, { toValue: H + 10, duration: 5000, useNativeDriver: true }),
    );
    const fade = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.07, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.07, duration: 4200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    );
    move.start();
    fade.start();
    return () => { move.stop(); fade.stop(); };
  }, []);

  return (
    <Animated.View style={[styles.scanLine, { opacity, transform: [{ translateY }] }]} />
  );
}

export function AnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <TopGlow />
      <BottomGlow />
      <ScanLine />
      {PARTICLES.map((p) => (
        <FloatingDot key={p.id} p={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: "absolute",
    top: -W * 0.3,
    left: W * 0.5 - W * 0.6,
    width: W * 1.2,
    height: W * 1.2,
    borderRadius: W * 0.6,
    backgroundColor: CYAN,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -W * 0.4,
    right: -W * 0.2,
    width: W * 0.9,
    height: W * 0.9,
    borderRadius: W * 0.45,
    backgroundColor: ORANGE,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: CYAN,
  },
});
