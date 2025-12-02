import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue, // ★追加: 値を計算して作るためのフック
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

// --- 設定 ---
const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const MAX_ANGLE = 12; // 動きが柔らかくなるので、少し角度を戻しても自然に見えます（8→15）
const PARALLAX_OFFSET = 2;

// ★追加: 慣性の物理設定
// ここをいじると「重さ」や「粘り気」が変わります
const PHYSICS_CONFIG = {
  mass: 1,        // 重さ（大きいほどドッシリする）
  stiffness: 120, // バネの硬さ（小さいほど指から遅れてついてくる）
  damping: 15,    // 摩擦（小さいほど揺れが止まらない）
};

export default function App() {
  // 1. 【入力】指の動きを受け取る「生の」値
  const inputX = useSharedValue(0);
  const inputY = useSharedValue(0);

  // 2. 【出力】入力値をバネの動きで追いかける値（これが慣性を生む）
  // useDerivedValueを使うと、inputの値が変わるたびに自動計算されます
  const rotateX = useDerivedValue(() => {
    return withSpring(inputX.value, PHYSICS_CONFIG);
  });
  
  const rotateY = useDerivedValue(() => {
    return withSpring(inputY.value, PHYSICS_CONFIG);
  });

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // ここでは input（目標値）だけを更新します
      // rotateX/Y は自動的に withSpring で追従してきます
      inputX.value = event.translationY * -0.3;
      inputY.value = event.translationX * 0.3;
    })
    .onEnd(() => {
      // 指を離したら目標値を0に戻すだけ
      // あとは物理演算で勝手にゆら〜っと戻ります
      inputX.value = 0;
      inputY.value = 0;
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rX = interpolate(rotateX.value, [-MAX_ANGLE, MAX_ANGLE], [-MAX_ANGLE, MAX_ANGLE], Extrapolation.CLAMP);
    const rY = interpolate(rotateY.value, [-MAX_ANGLE, MAX_ANGLE], [-MAX_ANGLE, MAX_ANGLE], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rX}deg` },
        { rotateY: `${rY}deg` },
      ],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(rotateY.value, [-MAX_ANGLE, MAX_ANGLE], [PARALLAX_OFFSET, -PARALLAX_OFFSET], Extrapolation.CLAMP);
    const translateY = interpolate(rotateX.value, [-MAX_ANGLE, MAX_ANGLE], [PARALLAX_OFFSET, -PARALLAX_OFFSET], Extrapolation.CLAMP);

    // 逆回転補正
    const reverseRotateX = interpolate(rotateX.value, [-MAX_ANGLE, MAX_ANGLE], [MAX_ANGLE * 0.1, -MAX_ANGLE * 0.1], Extrapolation.CLAMP);
    const reverseRotateY = interpolate(rotateY.value, [-MAX_ANGLE, MAX_ANGLE], [MAX_ANGLE * 0.1, -MAX_ANGLE * 0.1], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotateX: `${reverseRotateX}deg` },
        { rotateY: `${reverseRotateY}deg` },
      ],
    };
  });

  const sheenAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(rotateY.value, [-MAX_ANGLE, MAX_ANGLE], [120, -120], Extrapolation.CLAMP);
    const opacity = interpolate(Math.abs(rotateY.value), [0, MAX_ANGLE], [0.2, 0.5]);

    return {
      opacity,
      transform: [{ translateX }, { scale: 1.3 }],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.backgroundLayer} />
      <View style={styles.contentContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <Animated.View style={[styles.cardContent, contentAnimatedStyle]}>
              <View style={styles.circle} />
              <Text style={styles.title}>3D Card</Text>
              <Text style={styles.subtitle}>Drag me!</Text>
            </Animated.View>
            
            <View style={styles.sheenContainer} pointerEvents="none">
              <Animated.View style={[styles.sheenInner, sheenAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
    zIndex: -1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#222",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sheenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 20,
    overflow: "hidden",
  },
  sheenInner: {
    width: "180%",
    height: "180%",
    position: "absolute",
    top: "-40%",
    left: "-40%",
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "cyan",
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 18,
    marginTop: 10,
  },
});