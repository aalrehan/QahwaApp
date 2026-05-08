import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { theme } from '@/lib/theme';

type Props = {
  value: number;
  onChange: (n: number) => void;
  size?: number;
  color?: string;
};

const STAR_INDICES = [1, 2, 3, 4, 5];

export function StarRating({
  value,
  onChange,
  size = 36,
  color = theme.colors.orange,
}: Props) {
  const scales = useRef(STAR_INDICES.map(() => new Animated.Value(1))).current;

  function handlePress(index: number) {
    const anim = scales[index - 1];
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.25,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(value === index ? 0 : index);
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        direction: 'ltr',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {STAR_INDICES.map((i) => {
        const filled = i <= value;
        return (
          <Pressable
            key={i}
            onPress={() => handlePress(i)}
            style={{ padding: 4 }}
            hitSlop={6}
          >
            <Animated.View style={{ transform: [{ scale: scales[i - 1] }] }}>
              <Ionicons
                name={filled ? 'star' : 'star-outline'}
                size={size}
                color={filled ? color : theme.colors.dim}
              />
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}
