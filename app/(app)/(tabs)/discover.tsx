import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/lib/theme';

export default function DiscoverTab() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          paddingTop: 40,
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 32,
            fontFamily: theme.fonts.arabicDecorative.bold,
            textAlign: 'center',
          }}
        >
          قهوة
        </Text>
        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 12,
            fontFamily: theme.fonts.englishDisplay.italic,
            letterSpacing: 3,
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          QAHWA
        </Text>

        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 22,
            fontFamily: theme.fonts.arabicDisplay.bold,
            textAlign: 'center',
            marginTop: 40,
          }}
        >
          اكتشف
        </Text>
        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 14,
            fontFamily: theme.fonts.arabicBody.regular,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          قريباً...
        </Text>
      </View>
    </SafeAreaView>
  );
}
