import { Feather } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import { type ColorOption } from '@/lib/constants';
import { theme } from '@/lib/theme';

export type { ColorOption };

type Props = {
  options: ColorOption[];
  value: string | null;
  onChange: (id: string) => void;
};

export function ColorChips({ options, value, onChange }: Props) {
  const scalesRef = useRef<Record<string, Animated.Value>>({});
  if (Object.keys(scalesRef.current).length !== options.length) {
    options.forEach((o) => {
      if (!scalesRef.current[o.id]) {
        scalesRef.current[o.id] = new Animated.Value(1);
      }
    });
  }

  function handlePress(opt: ColorOption) {
    const anim = scalesRef.current[opt.id];
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(opt.id);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ direction: 'ltr' }}
      contentContainerStyle={{ paddingHorizontal: 8, gap: 12, paddingVertical: 4 }}
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => handlePress(opt)}
            style={{ alignItems: 'center', minWidth: 60 }}
          >
            <Animated.View
              style={{ transform: [{ scale: scalesRef.current[opt.id] }] }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: opt.hex,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? theme.colors.brown
                    : theme.colors.borderSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected && (
                  <Feather name="check" size={20} color={theme.colors.bg} />
                )}
              </View>
            </Animated.View>
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 11,
                color: selected ? theme.colors.brown : theme.colors.muted,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {opt.name_ar}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
