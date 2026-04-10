import Svg, { Path, Circle, G } from 'react-native-svg';

type LogoVariant = 'flame' | 'apple' | 'dumbbell';

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  color?: string;
  secondaryColor?: string;
}

/**
 * Variant 1: "Flame Leaf" — calorie flame merging with a leaf (burning calories + healthy eating)
 * Variant 2: "Apple Ring" — apple silhouette inside a progress ring (nutrition tracking)
 * Variant 3: "Dumbbell Fork" — dumbbell with fork tines (fitness + food)
 */
export default function Logo({ size = 80, variant = 'flame', color = '#4CAF50', secondaryColor = '#FB8C00' }: LogoProps) {
  switch (variant) {
    case 'flame':
      return <FlameLeafLogo size={size} color={color} secondaryColor={secondaryColor} />;
    case 'apple':
      return <AppleRingLogo size={size} color={color} secondaryColor={secondaryColor} />;
    case 'dumbbell':
      return <DumbbellForkLogo size={size} color={color} secondaryColor={secondaryColor} />;
  }
}

/** Flame merging into a leaf — calories + health */
function FlameLeafLogo({ size, color, secondaryColor }: { size: number; color: string; secondaryColor: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer flame / leaf shape */}
      <Path
        d="M50 8 C50 8, 20 35, 20 58 C20 75, 33 90, 50 90 C67 90, 80 75, 80 58 C80 35, 50 8, 50 8Z"
        fill={color}
      />
      {/* Inner flame highlight */}
      <Path
        d="M50 40 C50 40, 35 55, 35 65 C35 73, 42 80, 50 80 C58 80, 65 73, 65 65 C65 55, 50 40, 50 40Z"
        fill={secondaryColor}
        opacity={0.6}
      />
      {/* Leaf vein / stem */}
      <Path
        d="M50 55 L50 82"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M50 62 L42 56"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M50 68 L58 62"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
      />
    </Svg>
  );
}

/** Apple silhouette inside a progress ring */
function AppleRingLogo({ size, color, secondaryColor }: { size: number; color: string; secondaryColor: string }) {
  const cx = 50, cy = 50, r = 40;
  const circumference = 2 * Math.PI * r;
  const progress = 0.75;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Background ring */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={color}
        strokeWidth={5}
        fill="none"
        opacity={0.15}
      />
      {/* Progress arc */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={color}
        strokeWidth={5}
        fill="none"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Apple body */}
      <Path
        d="M50 30 C42 30, 32 38, 32 52 C32 68, 40 78, 50 78 C60 78, 68 68, 68 52 C68 38, 58 30, 50 30Z"
        fill={secondaryColor}
        opacity={0.85}
      />
      {/* Apple indent */}
      <Path
        d="M44 33 Q50 28, 56 33"
        stroke={secondaryColor}
        strokeWidth={2}
        fill="none"
        opacity={0.6}
      />
      {/* Leaf */}
      <Path
        d="M52 28 Q58 18, 62 22 Q58 28, 52 28Z"
        fill={color}
      />
      {/* Stem */}
      <Path
        d="M50 32 L50 26"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Dumbbell with fork tines — fitness meets nutrition */
function DumbbellForkLogo({ size, color, secondaryColor }: { size: number; color: string; secondaryColor: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* Left weight plate */}
        <Path
          d="M18 32 L18 68 Q18 72, 22 72 L28 72 Q32 72, 32 68 L32 32 Q32 28, 28 28 L22 28 Q18 28, 18 32Z"
          fill={color}
          opacity={0.9}
        />
        {/* Right weight plate */}
        <Path
          d="M68 32 L68 68 Q68 72, 72 72 L78 72 Q82 72, 82 68 L82 32 Q82 28, 78 28 L72 28 Q68 28, 68 32Z"
          fill={color}
          opacity={0.9}
        />
        {/* Bar */}
        <Path
          d="M32 46 L68 46 L68 54 L32 54Z"
          fill={color}
          opacity={0.5}
        />
        {/* Fork tines (centered, subtle) */}
        <Path
          d="M43 36 L43 26"
          stroke={secondaryColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d="M50 36 L50 24"
          stroke={secondaryColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d="M57 36 L57 26"
          stroke={secondaryColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Fork handle */}
        <Path
          d="M50 54 L50 78"
          stroke={secondaryColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
