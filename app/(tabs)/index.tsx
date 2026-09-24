import { Redirect } from 'expo-router';

import { Placeholder } from '@/components';
import { FEATURES } from '@/config/features';

export default function Today() {
  if (!FEATURES.today) return <Redirect href="/workouts" />;
  return <Placeholder eyebrow="Today" title="Today" body="Your day at a glance arrives in a later phase." />;
}
