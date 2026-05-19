import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { theme } from '@/lib/theme';

function Line({
  width,
  height,
  marginBottom,
  borderRadius,
  pulse,
}: {
  width: number | `${number}%`;
  height: number;
  marginBottom?: number;
  borderRadius?: number;
  pulse: Animated.Value;
}) {
  return (
    <Animated.View
      style={{
        width,
        height,
        marginBottom,
        borderRadius: borderRadius ?? 6,
        backgroundColor: theme.colors.surface2,
        alignSelf: 'center',
        opacity: pulse,
      }}
    />
  );
}

export function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 24,
        overflow: 'hidden',
        padding: 24,
      }}
    >
      {/* Header: café + date */}
      <Line width="50%" height={16} borderRadius={8} marginBottom={8} pulse={pulse} />
      <Line width="25%" height={10} marginBottom={24} pulse={pulse} />

      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.borderSoft,
          marginBottom: 20,
        }}
      />

      {/* Drink hero */}
      <Line width="65%" height={24} borderRadius={8} marginBottom={8} pulse={pulse} />
      <Line width="40%" height={12} marginBottom={24} pulse={pulse} />

      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.borderSoft,
          marginBottom: 20,
        }}
      />

      {/* Aroma lines */}
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Line width="80%" height={12} pulse={pulse} />
        <Line width="60%" height={12} pulse={pulse} />
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.borderSoft,
          marginBottom: 20,
        }}
      />

      {/* Stars row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Animated.View
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: theme.colors.surface2,
              opacity: pulse,
            }}
          />
        ))}
      </View>
      <Line width="30%" height={10} pulse={pulse} />
    </View>
  );
}
