import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { theme } from '@/lib/theme';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
};

export function EmptyState({ icon, title, subtitle, actionLabel }: Props) {
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
      {actionLabel && (
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
      )}
    </View>
  );
}
