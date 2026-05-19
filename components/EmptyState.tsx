import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/lib/theme';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({ icon, title, subtitle, actionLabel, onActionPress }: Props) {
  return (
    <View
      style={{
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 32,
      }}
    >
      <Feather name={icon} size={48} color={theme.colors.dim} />
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 22,
          fontFamily: theme.fonts.arabicDecorative.bold,
          marginTop: 16,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 14,
          fontFamily: theme.fonts.arabicBody.regular,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        {subtitle}
      </Text>
      {actionLabel ? (
        onActionPress ? (
          <Pressable
            onPress={onActionPress}
            android_ripple={{ color: theme.colors.surface2, borderless: false }}
            style={{
              marginTop: 20,
              alignSelf: 'center',
              backgroundColor: theme.colors.orange,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: theme.colors.surface,
                fontSize: 15,
                fontFamily: theme.fonts.arabicBody.medium,
                textAlign: 'center',
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              color: theme.colors.orange,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.medium,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {actionLabel}
          </Text>
        )
      ) : null}
    </View>
  );
}
