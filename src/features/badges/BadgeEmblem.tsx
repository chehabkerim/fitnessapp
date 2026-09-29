import { Badge } from '@/components/Badge';
import type { BadgeDef } from '@/lib/badges';
import { badgeA11yLabel } from '@/lib/badges';
import type { Units } from '@/lib/domain';

/** The emblem for a badge definition, with its accessible label ("Centurion badge, gold, locked, 37 of 100 workouts"). */
export function BadgeEmblem({ badge, earned, value, units, size, shine }: { badge: BadgeDef; earned: boolean; value: number; units: Units; size: number; shine?: boolean }) {
  return <Badge icon={badge.icon} bar={badge.bar} tier={badge.tier} earned={earned} size={size} shine={shine} label={badgeA11yLabel(badge, earned, value, units)} />;
}
