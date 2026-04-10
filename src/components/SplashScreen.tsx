import { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors } = useTheme();
  const called = useRef(false);

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(15)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  const finish = useCallback(() => {
    if (called.current) return;
    called.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Safety fallback — if animation gets stuck, finish after 3s
    const timeout = setTimeout(finish, 3000);

    Animated.sequence([
      // Logo fades in + scales up
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Pause
      Animated.delay(500),
      // Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearTimeout(timeout);
      finish();
    });

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeOut }]}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.iconText}>🔥</Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              color: colors.text,
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Calora
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
});
