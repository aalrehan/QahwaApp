import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { CoffeeLogCard } from '@/components/CoffeeLogCard';
import { shareLogCard } from '@/lib/share-log';
import { theme } from '@/lib/theme';
import type { CoffeeLog } from '@/lib/types';

type Props = {
  log: CoffeeLog;
  variant: 'feed' | 'diary';
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
};

// Wraps CoffeeLogCard in a ViewShot so the in-card share button can
// snapshot the rendered card to PNG and hand it to the OS share sheet.
// The cream background is set on the ViewShot wrapper (not the card)
// so the captured image has a non-transparent backdrop on every platform.
export function ShareableCoffeeLogCard({
  log,
  variant,
  isLiked,
  likesCount,
  onLike,
}: Props) {
  const viewShotRef = useRef<ViewShot | null>(null);

  const handleShare = useCallback(() => {
    void shareLogCard(viewShotRef);
  }, []);

  return (
    <View style={{ backgroundColor: theme.colors.bg }}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.95, result: 'tmpfile' }}
        style={{ backgroundColor: theme.colors.bg }}
      >
        <CoffeeLogCard
          log={log}
          variant={variant}
          isLiked={isLiked}
          likesCount={likesCount}
          onLike={onLike}
          onShare={handleShare}
        />
      </ViewShot>
    </View>
  );
}
