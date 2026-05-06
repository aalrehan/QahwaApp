import { Text, View } from 'react-native';

import { theme } from '@/lib/theme';

export function Step6Final() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 24,
          fontFamily: theme.fonts.arabicDecorative.bold,
          textAlign: 'center',
        }}
      >
        قريباً
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        التقييم النهائي
      </Text>
    </View>
  );
}
