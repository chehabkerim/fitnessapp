import { memo } from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import type { Muscle } from '../../lib/domain';
import { MUSCLE_LABELS } from '../../lib/domain';
import type { FigureView } from '../../lib/muscles';
import { useTheme } from '../../theme';
import { HEAD, SHAPES, VIEWBOX } from './geometry';

// Small tiles crop chin-to-belt so the torso and arms fill the width.
const SMALL_CROP = { x: 22, y: 44, size: 156 };
const MIRROR = `translate(${VIEWBOX.w},0) scale(-1,1)`;

export interface MuscleMapProps {
  view: FigureView;
  primary: readonly Muscle[];
  secondary: readonly Muscle[];
  size: 'small' | 'large';
  /** Tile side for small; figure height for large. */
  px: number;
  /** Colour of the separation gaps: the surface the figure sits on. */
  gapColor: string;
}

function MuscleMapImpl({ view, primary, secondary, size, px, gapColor }: MuscleMapProps) {
  const { c } = useTheme();
  const s = SHAPES[view];
  const large = size === 'large';
  const fillFor = (k: Muscle) => (primary.includes(k) ? c.figurePrimary : secondary.includes(k) ? c.figureSecondary : c.figureBody);
  const regions = Object.entries(s.regions) as [Muscle, string][];

  const vb = large ? `0 0 ${VIEWBOX.w} ${VIEWBOX.h}` : `${SMALL_CROP.x} ${SMALL_CROP.y} ${SMALL_CROP.size} ${SMALL_CROP.size}`;
  const width = large ? (px * VIEWBOX.w) / VIEWBOX.h : px;
  const unitsPerPx = large ? VIEWBOX.h / px : SMALL_CROP.size / px;
  const sw = (large ? 1.2 : 0.9) * unitsPerPx;

  const half = large ? (
    <>
      {[...s.base, ...s.body].map((d, i) => (
        <Path key={`b${i}`} d={d} fill={c.figureBody} stroke={gapColor} strokeWidth={sw} strokeLinejoin="round" />
      ))}
      {s.largeLines.map((d, i) => (
        <Path key={`l${i}`} d={d} fill="none" stroke={gapColor} strokeWidth={sw} strokeLinecap="round" />
      ))}
      {regions.map(([k, d]) => (
        <Path key={k} d={d} fill={fillFor(k)} stroke={gapColor} strokeWidth={sw} strokeLinejoin="round" />
      ))}
    </>
  ) : (
    // Small: one solid silhouette; only highlighted regions get gaps so they read as clear shapes.
    <>
      {[...s.base, ...s.body].map((d, i) => (
        <Path key={`b${i}`} d={d} fill={c.figureBody} />
      ))}
      {regions
        .filter(([k]) => primary.includes(k) || secondary.includes(k))
        .map(([k, d]) => (
          <Path key={k} d={d} fill={fillFor(k)} stroke={gapColor} strokeWidth={sw} strokeLinejoin="round" />
        ))}
    </>
  );

  const label = `${view === 'front' ? 'Front' : 'Back'} view. Primary: ${primary.map((m) => MUSCLE_LABELS[m]).join(', ') || 'none'}${
    secondary.length ? `. Secondary: ${secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}` : ''
  }.`;

  return (
    <Svg width={width} height={px} viewBox={vb} accessibilityRole="image" accessibilityLabel={label}>
      <G>{half}</G>
      <G transform={MIRROR}>{half}</G>
      <Ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={c.figureBody} stroke={large ? gapColor : 'none'} strokeWidth={sw} />
    </Svg>
  );
}

export const MuscleMap = memo(MuscleMapImpl);
