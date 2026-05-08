import { Pressable, Text, View } from 'react-native';

import { theme } from '@/lib/theme';

const LEVELS = [
  { level: 1, ar: 'خفيف' },
  { level: 2, ar: 'معتدل' },
  { level: 3, ar: 'متوسط' },
  { level: 4, ar: 'قوي' },
  { level: 5, ar: 'طاغي' },
];

const FILL_COLORS: Record<number, string> = {
  1: theme.colors.orangeSoft,
  2: theme.colors.orange,
  3: '#B85819',
  4: '#923E18',
  5: theme.colors.brown,
};

type Props = {
  value: number;
  onChange: (n: number) => void;
};

export function IntensityDial({ value, onChange }: Props) {
  const empty = !value || value < 1;

  return (
    <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          direction: 'ltr',
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.borderSoft,
          overflow: 'hidden',
          borderWidth: empty ? 1 : 0,
          borderColor: theme.colors.border,
        }}
      >
        {LEVELS.map((seg, i) => {
          const filled = !empty && seg.level <= value;
          const isLast = i === LEVELS.length - 1;
          return (
            <Pressable
              key={seg.level}
              onPress={() => onChange(seg.level)}
              android_ripple={{ color: theme.colors.surface2 }}
              style={{
                flex: 1,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: filled ? FILL_COLORS[seg.level] : 'transparent',
                borderRightWidth: isLast ? 0 : 1,
                borderRightColor: 'rgba(255,255,255,0.4)',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 18,
                  fontFamily: theme.fonts.arabicDisplay.semibold,
                  color: filled ? theme.colors.bg : theme.colors.muted,
                  includeFontPadding: false,
                }}
              >
                {seg.level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          direction: 'ltr',
          marginTop: 10,
          width: '100%',
        }}
      >
        {LEVELS.map((seg) => {
          const active = seg.level === value;
          return (
            <Text
              key={seg.level}
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 11,
                color: active ? theme.colors.brown : theme.colors.muted,
              }}
            >
              {seg.ar}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
