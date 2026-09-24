import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { fonts, useTheme } from '../theme';

export interface Point {
  x: number; // e.g. epoch ms
  y: number;
  label: string; // x label (short date)
}

/** Thin editorial line chart (react-native-svg). Shows first/last labels and the min/max values. */
export function LineChart({ points, height = 160, format, accessibilityLabel }: { points: Point[]; height?: number; format: (v: number) => string; accessibilityLabel: string }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const pad = { l: 4, r: 4, t: 22, b: 24 };

  if (points.length === 0) return null;
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanY = maxY - minY || Math.max(1, maxY * 0.1);
  const n = points.length;
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const px = (i: number) => pad.l + (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const py = (y: number) => pad.t + h - ((y - minY) / spanY) * h * 0.9 - h * 0.05;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const last = points[n - 1]!;

  return (
    <View onLayout={onLayout} style={{ height }} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={pad.l} x2={width - pad.r} y1={pad.t + h} y2={pad.t + h} stroke={c.line} strokeWidth={1} />
          <Path d={d} stroke={c.accent} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={px(i)} cy={py(p.y)} r={i === n - 1 ? 3.5 : 2} fill={i === n - 1 ? c.accent : c.surface} stroke={c.accent} strokeWidth={1.25} />
          ))}
          <SvgText x={Math.min(px(n - 1), width - pad.r)} y={py(last.y) - 9} fill={c.ink} fontSize={13} fontFamily={fonts.bodyMedium} textAnchor={n === 1 ? 'middle' : 'end'}>
            {format(last.y)}
          </SvgText>
          <SvgText x={pad.l} y={height - 6} fill={c.muted} fontSize={12} fontFamily={fonts.body}>
            {points[0]!.label}
          </SvgText>
          {n > 1 && (
            <SvgText x={width - pad.r} y={height - 6} fill={c.muted} fontSize={12} fontFamily={fonts.body} textAnchor="end">
              {last.label}
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}
