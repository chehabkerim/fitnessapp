import { useCallback, useContext, useSyncExternalStore } from 'react';
// Not re-exported from the package root; it's React Navigation's context, which expo-router bundles.
import { NavigationContext } from 'expo-router/build/react-navigation/core';

/**
 * Whether the screen this component belongs to is focused. Outside any navigator (the root layout) it is
 * always true. Unlike `useIsFocused`, it doesn't throw outside a navigator.
 */
export function useScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!navigation) return () => {};
      const offFocus = navigation.addListener('focus', onChange);
      const offBlur = navigation.addListener('blur', onChange);
      return () => {
        offFocus();
        offBlur();
      };
    },
    [navigation],
  );
  const get = () => (navigation ? navigation.isFocused() : true);
  return useSyncExternalStore(subscribe, get, get);
}
