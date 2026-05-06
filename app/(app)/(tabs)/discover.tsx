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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 32,
              fontFamily: theme.fonts.arabicDecorative.bold,
            }}
          >
            قهوة
          </Text>
          <View
            style={{
              width: 1,
              height: 20,
              backgroundColor: theme.colors.border,
              marginHorizontal: 14,
              opacity: 0.7,
              alignSelf: 'center',
            }}
          />
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 14,
              fontFamily: theme.fonts.englishDisplay.italic,
              letterSpacing: 3,
            }}
          >
            QAHWA
          </Text>
        </View>

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
