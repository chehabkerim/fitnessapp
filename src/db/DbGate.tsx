import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { space, useTheme } from '../theme';
import { openEngine } from './client';
import type { OpenResult } from './open';
import { attachEngine, detachEngine } from './store';

type State = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string } | { kind: 'locked'; takeOver: () => Promise<OpenResult> } | { kind: 'lost' };

/** Opens the database before rendering the app; shows loading, error and "open in another tab" states. */
export function DbGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const apply = useCallback((r: OpenResult) => {
    if (r.status === 'locked') return setState({ kind: 'locked', takeOver: r.takeOver });
    attachEngine(r.engine);
    r.onLost(() => {
      detachEngine();
      setState({ kind: 'lost' });
    });
    setState({ kind: 'ready' });
  }, []);
  const fail = useCallback((e: unknown) => {
    console.error(e);
    setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
  }, []);

  useEffect(() => {
    openEngine().then(apply, fail);
  }, [apply, fail]);

  const retry = (open: () => Promise<OpenResult>) => {
    setState({ kind: 'loading' });
    open().then(apply, fail);
  };

  if (state.kind === 'ready') return <>{children}</>;
  if (state.kind === 'loading') return <Centered><ActivityIndicator /><Text color="muted">Opening your log…</Text></Centered>;
  if (state.kind === 'error')
    return (
      <Centered>
        <Text variant="heading" align="center">Your log couldn’t be opened</Text>
        <Text color="muted" align="center">{state.message}</Text>
        <Button label="Try again" onPress={() => retry(openEngine)} />
      </Centered>
    );
  const takeOver = state.kind === 'locked' ? state.takeOver : null;
  return (
    <Centered>
      <Text variant="heading" align="center">Plus Ultra is open in another tab</Text>
      <Text color="muted" align="center">To keep your log safe, only one tab can use it at a time.</Text>
      <Button
        label="Use here instead"
        onPress={() => (takeOver ? retry(takeOver) : typeof location !== 'undefined' && location.reload())}
      />
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={[styles.center, { backgroundColor: c.bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xxl },
});
