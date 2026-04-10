import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Animated AI thinking indicator:
 * - Rotating progress ring around a sparkle icon
 * - 3 bouncing dots
 * - Themed text
 */
export default function AIThinkingAnimation() {
  const { colors, tint } = useTheme();
  const { t } = useI18n();

  const rotation = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Spinning ring
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Bouncing dots with stagger
    const createBounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -6,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );

    const b1 = createBounce(dot1, 0);
    const b2 = createBounce(dot2, 150);
    const b3 = createBounce(dot3, 300);
    b1.start();
    b2.start();
    b3.start();

    return () => {
      spin.stop();
      b1.stop();
      b2.stop();
      b3.stop();
    };
  }, []);

  const spinInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={[styles.card, { backgroundColor: tint(colors.primary, 0.06) }]}>
        {/* Spinning ring with sparkle */}
        <View style={styles.iconWrap}>
          <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
            <Svg width={32} height={32} viewBox="0 0 32 32">
              <Circle
                cx={16} cy={16} r={13}
                stroke={tint(colors.primary, 0.15)}
                strokeWidth={2.5}
                fill="none"
              />
              <Circle
                cx={16} cy={16} r={13}
                stroke={colors.primary}
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="20 62"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
          {/* Static sparkle in center */}
          <View style={styles.sparkleCenter}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path
                d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"
                fill={colors.primary}
              />
            </Svg>
          </View>
        </View>

        {/* Text + dots */}
        <View style={styles.textRow}>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            {t('ai_thinking')}
          </Text>
          <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ translateY: dot }],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleCenter: {
    position: 'absolute',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    height: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
