import { LinearGradient } from "expo-linear-gradient";
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
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

  // ... import文などはそのまま

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// ★ここに追加: 傾きの最大角度を設定
// 15度くらいが上品でおすすめです（元は30度でした）
const MAX_ANGLE = 15; 

export default function App() {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  // ジェスチャー感度はそのままでOK（あるいは好みに応じて変更）
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = event.translationY * -0.3;
      rotateY.value = event.translationX * 0.3;
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    // ★修正: 定数を使用
    const rX = interpolate(
      rotateX.value,
      [-MAX_ANGLE, MAX_ANGLE], // 入力範囲
      [-MAX_ANGLE, MAX_ANGLE], // 出力範囲
      Extrapolation.CLAMP      // これ以上は回らないように制限
    );
    const rY = interpolate(
      rotateY.value,
      [-MAX_ANGLE, MAX_ANGLE],
      [-MAX_ANGLE, MAX_ANGLE],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rX}deg` },
        { rotateY: `${rY}deg` },
      ],
    };
  });

  const parallaxStyle = useAnimatedStyle(() => {
    // ★修正: 中身のズレも最大角度に合わせて連動させる
    const translateX = interpolate(
      rotateY.value,
      [-MAX_ANGLE, MAX_ANGLE],
      [-25, 25], 
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      rotateX.value,
      [-MAX_ANGLE, MAX_ANGLE],
      [-25, 25],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const sheenAnimatedStyle = useAnimatedStyle(() => {
    // ★修正: 光の移動も最大角度に合わせて連動させる
    const translateX = interpolate(
      rotateY.value,
      [-MAX_ANGLE, MAX_ANGLE],
      [100, -100], 
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      Math.abs(rotateY.value),
      [0, MAX_ANGLE], // 0度から最大角度までの間で変化
      [0.3, 0.6]
    );

    return {
      opacity,
      transform: [{ translateX }, { scale: 1.2 }],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.backgroundLayer} />

      <View style={styles.contentContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <Animated.View style={[styles.cardContent, parallaxStyle]}>
              <View style={styles.circle} />
              <Text style={styles.title}>3D Card</Text>
              <Text style={styles.subtitle}>Drag me!</Text>
            </Animated.View>

            {/* ★変更点: 光の反射レイヤー */}
            <View style={styles.sheenContainer} pointerEvents="none">
              <Animated.View style={[styles.sheenInner, sheenAnimatedStyle]}>
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(255, 255, 255, 0.05)", // 0.1 -> 0.05 (端の光を薄く)
                    "rgba(255, 255, 255, 0.3)", // 0.8 -> 0.3 (中心の強い光をかなり薄く)
                    "rgba(255, 255, 255, 0.05)", // 0.1 -> 0.05
                    "transparent",
                  ]}
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
    // overflow: "hidden" はここではなく、sheenContainerで制御してもよいが、
    // カードの角丸に合わせるためにここにつけておくのが無難
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  // ★追加: 光沢を閉じ込めるコンテナ
  sheenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 20, // カードと同じ角丸
    overflow: "hidden", // はみ出した光をカット
  },
  // ★追加: 実際に動く光の帯（カードより大きく作る）
  sheenInner: {
    width: "200%", // 幅を広くしてスライドさせる余裕を持たせる
    height: "200%",
    position: "absolute",
    top: "-50%", // 中央配置調整
    left: "-50%", // 中央配置調整
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
