import { Link } from 'expo-router';

import { EmptyState, Screen, Text } from '@/components';

export default function NotFound() {
  return (
    <Screen back>
      <EmptyState title="This page doesn't exist">
        <Link href="/workouts">
          <Text color="accentText" variant="bodyMedium">
            Go to your workouts
          </Text>
        </Link>
      </EmptyState>
    </Screen>
  );
}
