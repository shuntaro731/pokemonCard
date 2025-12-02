import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

// --- 設定 ---
const DEFAULT_MAX_ANGLE = 12;
const DEFAULT_PARALLAX_OFFSET = 2;

const SPRING_CONFIG: WithSpringConfig = {
  mass: 1,
  stiffness: 120,
  damping: 18,
};

interface ThreeDCardProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  maxAngle?: number;
  parallaxOffset?: number;
}

export const ThreeDCard: React.FC<ThreeDCardProps> = ({
  children,
  width = 300,
  height = 450,
  style,
  maxAngle = DEFAULT_MAX_ANGLE,
  parallaxOffset = DEFAULT_PARALLAX_OFFSET,
}) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = event.translationY * -0.4;
      rotateY.value = event.translationX * 0.4;
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, SPRING_CONFIG);
      rotateY.value = withSpring(0, SPRING_CONFIG);
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rX = interpolate(
      rotateX.value,
      [-maxAngle, maxAngle],
      [-maxAngle, maxAngle],
      Extrapolation.CLAMP
    );
    const rY = interpolate(
      rotateY.value,
      [-maxAngle, maxAngle],
      [-maxAngle, maxAngle],
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

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      rotateY.value,
      [-maxAngle, maxAngle],
      [parallaxOffset, -parallaxOffset],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      rotateX.value,
      [-maxAngle, maxAngle],
      [parallaxOffset, -parallaxOffset],
      Extrapolation.CLAMP
    );

    const reverseRotateX = interpolate(
      rotateX.value,
      [-maxAngle, maxAngle],
      [maxAngle * 0.1, -maxAngle * 0.1],
      Extrapolation.CLAMP
    );
    const reverseRotateY = interpolate(
      rotateY.value,
      [-maxAngle, maxAngle],
      [maxAngle * 0.1, -maxAngle * 0.1],
      Extrapolation.CLAMP
    );

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
    const translateX = interpolate(
      rotateY.value,
      [-maxAngle, maxAngle],
      [120, -120],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      Math.abs(rotateY.value),
      [0, maxAngle],
      [0.2, 0.5]
    );

    return {
      opacity,
      transform: [{ translateX }, { scale: 1.3 }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.cardContainer,
          { width, height },
          style,
          cardAnimatedStyle,
        ]}
        shouldRasterizeIOS={false}
        renderToHardwareTextureAndroid={false}
        {...({ allowsEdgeAntialiasing: true } as ViewProps)}
      >
        {/* ★修正3: 内側のViewで「背景」「ボーダー」「Overflow」を担当 */}
        <View style={styles.cardInner}>
          {/* コンテンツ */}
          <Animated.View style={[styles.cardContent, contentAnimatedStyle]}>
            {children}
          </Animated.View>

          {/* 光沢レイヤー */}
          <View style={styles.sheenContainer} pointerEvents="none">
            <Animated.View style={[styles.sheenInner, sheenAnimatedStyle]}>
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(255, 255, 255, 0.05)",
                  "rgba(255, 255, 255, 0.08)",
                  "rgba(255, 255, 255, 0.05)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  // ★役割分担: 影と配置
  cardContainer: {
    backgroundColor: "transparent", // 透明にしておく
    zIndex: 1,

    // Shadowプロパティはここに残す
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,

    // overflow: 'hidden' は削除 (影を切らないため)
  },

  // ★役割分担: 見た目と切り抜き
  cardInner: {
    flex: 1, // 親のサイズいっぱいに広げる
    backgroundColor: "#222",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden", // 光沢をここで切り抜く
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
    // borderRadiusは親のcardInnerで効いているのでここでは不要
  },
  sheenInner: {
    width: "180%",
    height: "180%",
    position: "absolute",
    top: "-40%",
    left: "-40%",
  },
});
