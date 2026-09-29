// Badge emblem (enamel pin). Reproduces design/plus-ultra/badge-emblem-reference.html exactly:
// viewBox -4 -2 108 144; layers back to front: blurred drop shadow, metal rim (tier gradient), inner bevel
// (0.92, reversed gradient), purple enamel (0.84) with a dark edge, a faint top-left sheen, the icon (dark copy
// 2 below, then metal), 1–4 stars on an arc, diamond sparkles, and the number bar.
// Brand purple enamel is one of the three places the brand colours appear (with the logo and the app icon).
import { useEffect, useId, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, ClipPath, Defs, FeGaussianBlur, Filter, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import type { BadgeIcon, BadgeTier } from '../lib/badges';
import { fonts } from '../theme';

const HEX = 'M50 4 L94 29 L94 83 L50 108 L6 83 L6 29 Z';
const ABOUT_CENTRE = (scale: number) => `translate(50 56) scale(${scale}) translate(-50 -56)`;
// <use x="-8" y="-8" width="116" height="130"> of a 0 0 100 112 symbol (xMidYMid meet): scale 1.16, y offset 0.04.
const ICON_AT = (dy: number) => `translate(-8 ${(-8 + dy + 0.04).toFixed(2)}) scale(1.16)`;

type Metal = 'bronze' | 'silver' | 'gold' | 'diamond' | 'locked';
const METALS: Record<Metal, [number, string][]> = {
  bronze: [[0, '#5A2D12'], [0.22, '#EDB387'], [0.45, '#A8622F'], [0.56, '#F6CBA6'], [0.76, '#8E4E24'], [1, '#4A230C']],
  silver: [[0, '#5E6670'], [0.22, '#F2F5F8'], [0.45, '#9AA3AD'], [0.56, '#FFFFFF'], [0.76, '#8A939D'], [1, '#4E555E']],
  gold: [[0, '#7A4E0B'], [0.22, '#F7D774'], [0.45, '#C8922A'], [0.56, '#FFF1B8'], [0.76, '#B07A1C'], [1, '#6E4508']],
  diamond: [[0, '#4E86B8'], [0.18, '#E8FBFF'], [0.36, '#8FD6F2'], [0.5, '#FFFFFF'], [0.66, '#C3B2F5'], [0.82, '#7FC8EE'], [1, '#3E5E9E']],
  locked: [[0, '#2E2F33'], [0.5, '#55575D'], [1, '#232427']],
};
const BEVELS: Record<Metal, [number, string][]> = {
  bronze: [[0, '#F6CBA6'], [0.5, '#8E4E24'], [1, '#4A230C']],
  silver: [[0, '#FFFFFF'], [0.5, '#8A939D'], [1, '#4E555E']],
  gold: [[0, '#FFF1B8'], [0.5, '#B07A1C'], [1, '#6E4508']],
  diamond: [[0, '#F2FCFF'], [0.5, '#8FB8E6'], [1, '#3E5E9E']],
  locked: [[0, '#4A4C52'], [1, '#1E1F22']],
};
const ENAMEL = { purple: ['#4A2466', '#170A22'], locked: ['#26262A', '#121214'] } as const;
const TIER_METAL: Record<BadgeTier, Metal> = { 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'diamond' };

const DARK = { stroke: '#000000', strokeOpacity: 0.35, strokeWidth: 0.8 };

/** Icon artwork in symbol space (0 0 100 112), centred on (50, 55.2). Filled set, except loop and return (outline). */
function iconArt(icon: BadgeIcon): ReactNode {
  switch (icon) {
    case 'dumbbell':
      return (
        <G transform="rotate(-30 50 55.2)" {...DARK}>
          <Rect x="40" y="52.7" width="20" height="5" rx="2" />
          <Rect x="32" y="42" width="8.5" height="26.4" rx="2.5" />
          <Rect x="59.5" y="42" width="8.5" height="26.4" rx="2.5" />
          <Rect x="25.5" y="47" width="6.5" height="16.4" rx="2" />
          <Rect x="68" y="47" width="6.5" height="16.4" rx="2" />
        </G>
      );
    case 'flame':
      return <Path {...DARK} transform="translate(50 55.2) scale(1.1) translate(-50 -47.5)" d="M50 30 C56 38 62 42 62 52 C62 60 57 65 50 65 C43 65 38 60 38 52 C38 46 41 42 45 38 C45 44 48 47 50 47 C48 41 48 35 50 30 Z" />;
    case 'bolt':
      return <Path {...DARK} transform="translate(50 55.2) scale(0.95) translate(-50 -48)" d="M54 28 L37 51 H48 L45 68 L63 42 H52 Z" />;
    case 'kettlebell':
      return (
        <>
          <Path fill="none" strokeWidth={5.5} strokeLinecap="round" d="M41.5 52 C40.5 38 59.5 38 58.5 52" />
          <Circle cx="50" cy="60" r="13.5" {...DARK} />
        </>
      );
    case 'sun':
      return (
        <>
          <Circle cx="50" cy="55.2" r="10" {...DARK} />
          <Path fill="none" strokeWidth={4.5} strokeLinecap="round" d="M50 36.2 V39.2 M50 71.2 V74.2 M31 55.2 H34 M66 55.2 H69 M36.6 41.8 L38.7 43.9 M61.3 66.5 L63.4 68.6 M36.6 68.6 L38.7 66.5 M61.3 43.9 L63.4 41.8" />
        </>
      );
    case 'moon':
      return <Path {...DARK} transform="translate(50 55.2) scale(0.95) translate(-48 -48)" d="M55 28 A20 20 0 1 0 66 60 A15 15 0 1 1 55 28 Z" />;
    case 'check':
      return <Path fill="none" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" d="M35.5 56 L45.5 66 L65 44.5" />;
    case 'loop':
      return (
        <G transform="translate(50 55.2) scale(1.2) translate(-50.02 -48.49)" fill="none" strokeWidth={4.17} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M63 52 A13 13 0 1 1 57 40" />
          <Path d="M52 33 L59 40 L51 45" />
        </G>
      );
    case 'return':
      return (
        <G transform="translate(50 55.2) scale(1.2) translate(-49.00 -49.50)">
          <Path fill="none" strokeWidth={4.17} strokeLinecap="round" strokeLinejoin="round" d="M61 64 V53 A10 10 0 0 0 51 43 H38 M45 35 L37 43 L45 51" />
        </G>
      );
  }
}

/** Five-pointed star path (the reference's `star()`), inner radius 0.45. */
export function starPath(cx: number, cy: number, r: number, rot: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5 + rot;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** One star per tier on an arc (centre 50,55.2, radius 31), 21° apart, centred on the top, each following the arc. */
export function starPaths(tier: BadgeTier): string[] {
  return Array.from({ length: tier }, (_, i) => {
    const a = ((-90 + (i - (tier - 1) / 2) * 21) * Math.PI) / 180;
    return starPath(50 + 31 * Math.cos(a), 55.2 + 31 * Math.sin(a), 4.2, a + Math.PI / 2);
  });
}

export interface BadgeProps {
  icon: BadgeIcon;
  /** Number bar text: "10", "2W", "10T", "ALL". */
  bar: string;
  tier: BadgeTier;
  earned: boolean;
  /** Width in px; the emblem is 4:3 tall. Sharp from 34px to 200px+. */
  size: number;
  /** Play the single shine sweep (earn reveal). Skipped when reduce-motion is on. */
  shine?: boolean;
  /** Accessible name, e.g. "Centurion badge, gold, locked, 37 of 100 workouts". */
  label: string;
}

export function Badge({ icon, bar, tier, earned, size, shine = false, label }: BadgeProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const metal: Metal = earned ? TIER_METAL[tier] : 'locked';
  const enamel = earned ? ENAMEL.purple : ENAMEL.locked;
  const url = (name: string) => `url(#${id}${name})`;
  const iconColor = earned ? url('m') : '#6A6C72';
  const plateW = Math.max(40, bar.length * 8.5 + 20);
  const shineX = useShine(shine && earned);

  return (
    <Svg width={size} height={Math.round(size * 1.333)} viewBox="-4 -2 108 144" accessible accessibilityRole="image" accessibilityLabel={label}>
      <Defs>
        <LinearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          {METALS[metal].map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="1" y1="1" x2="0" y2="0">
          {BEVELS[metal].map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <RadialGradient id={`${id}e`} cx="0.35" cy="0.25" r="0.9">
          <Stop offset="0" stopColor={enamel[0]} />
          <Stop offset="1" stopColor={enamel[1]} />
        </RadialGradient>
        <LinearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
        <ClipPath id={`${id}c`}>
          <Path d={HEX} />
        </ClipPath>
        <Filter id={`${id}d`} x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur stdDeviation={2.2} />
        </Filter>
      </Defs>

      <Path d={HEX} transform="translate(0 3)" fill="#000000" fillOpacity={0.45} filter={url('d')} />
      <Path d={HEX} fill={url('m')} />
      <Path d={HEX} transform={ABOUT_CENTRE(0.92)} fill={url('b')} />
      <Path d={HEX} transform={ABOUT_CENTRE(0.84)} fill={url('e')} />
      <Path d={HEX} transform={ABOUT_CENTRE(0.84)} fill="none" stroke="#000000" strokeOpacity={0.5} strokeWidth={1.2} />
      <G clipPath={url('c')}>
        <Path d="M0 0 L100 0 L100 18 L0 58 Z" fill="#FFFFFF" fillOpacity={0.06} />
      </G>

      <G transform={ICON_AT(2)} stroke="#000000" fill="#000000" opacity={0.6}>
        {iconArt(icon)}
      </G>
      <G transform={ICON_AT(0)} stroke={iconColor} fill={iconColor}>
        {iconArt(icon)}
      </G>

      {earned && starPaths(tier).map((d) => <Path key={d} d={d} fill={url('m')} stroke="#000000" strokeOpacity={0.45} strokeWidth={0.6} />)}

      {earned && tier === 4 && (
        <G fill="#FFFFFF">
          <Path d="M26 44 L27.2 47.8 L31 49 L27.2 50.2 L26 54 L24.8 50.2 L21 49 L24.8 47.8 Z" fillOpacity={0.9} />
          <Path d="M74 66 L74.9 68.6 L77.5 69.5 L74.9 70.4 L74 73 L73.1 70.4 L70.5 69.5 L73.1 68.6 Z" fillOpacity={0.8} />
          <Path d="M71 38 L71.6 39.9 L73.5 40.5 L71.6 41.1 L71 43 L70.4 41.1 L68.5 40.5 L70.4 39.9 Z" fillOpacity={0.7} />
        </G>
      )}

      {shineX != null && (
        <G clipPath={url('c')}>
          <Rect x={-40 + shineX} y="-10" width="30" height="140" fill={url('s')} transform="skewX(-20)" />
        </G>
      )}

      <Rect x={50 - plateW / 2} y="115" width={plateW} height="22" rx="5" fill={url('m')} />
      <Rect x={51.6 - plateW / 2} y="116.6" width={plateW - 3.2} height="18.8" rx="3.8" fill={url('e')} />
      <SvgText x="50" y="131" textAnchor="middle" fontFamily={fonts.cond800i} fontSize={bar.length <= 4 ? 15 : 13} fill={earned ? '#F4F1EA' : '#8A8C92'}>
        {bar}
      </SvgText>
    </Svg>
  );
}

/** A single white shine sweep (~1.3s, like the reference's 0.4 × 3.2s pass); null when not playing. */
function useShine(play: boolean): number | null {
  const [x, setX] = useState<number | null>(null);
  useEffect(() => {
    if (!play) return;
    let cancelled = false;
    const v = new Animated.Value(-20);
    const sub = v.addListener(({ value }) => !cancelled && setX(value));
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      Animated.timing(v, { toValue: 160, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(() => !cancelled && setX(null));
    });
    return () => {
      cancelled = true;
      v.removeListener(sub);
      v.stopAnimation();
    };
  }, [play]);
  return x;
}
