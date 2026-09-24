import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ActionSheet } from '@/components';
import { ActiveWorkoutExistsError, useRepos, type StartOptions } from '@/db';
import { haptics } from '@/platform/haptics';

/** Start a workout (empty, template, repeat). If one is already running, offer to resume or replace it. */
export function useStartWorkout() {
  const repos = useRepos();
  const router = useRouter();
  const [conflict, setConflict] = useState<{ opts: StartOptions; activeId: number } | null>(null);

  const go = () => router.push('/workout/active');
  const start = (opts: StartOptions) => {
    try {
      repos.workouts.start(opts);
      haptics.light();
      go();
    } catch (e) {
      if (e instanceof ActiveWorkoutExistsError) setConflict({ opts, activeId: e.workoutId });
      else throw e;
    }
  };

  const sheet = (
    <ActionSheet
      visible={!!conflict}
      onClose={() => setConflict(null)}
      title="A workout is in progress"
      message="Resume it, or discard it and start the new one."
      actions={[
        { label: 'Resume current workout', onPress: go },
        {
          label: 'Discard it and start new',
          destructive: true,
          onPress: () => {
            if (!conflict) return;
            repos.workouts.discard(conflict.activeId);
            repos.appState.update({ restEndsAt: null, restDurationSec: null });
            start(conflict.opts);
          },
        },
      ]}
    />
  );
  return { start, sheet };
}
