import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/lib/theme';

export default function FeedTab() {
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
              lineHeight: 32,
              fontFamily: theme.fonts.arabicDecorative.bold,
              includeFontPadding: false,
            }}
          >
            قهوة
          </Text>
          <View
            style={{
              width: 1,
              height: 18,
              backgroundColor: theme.colors.border,
              marginHorizontal: 12,
              opacity: 0.6,
              alignSelf: 'center',
            }}
          />
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 32,
              lineHeight: 32,
              fontFamily: theme.fonts.englishDisplay.italic,
              letterSpacing: 4,
              includeFontPadding: false,
              marginTop: -4,
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
          الرئيسية
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
          ابدأ بتسجيل قهوتك الأولى
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderSoft,
            borderRadius: 16,
            padding: 24,
            marginTop: 32,
            width: '100%',
            maxWidth: 360,
          }}
        >
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 14,
              fontFamily: theme.fonts.arabicBody.medium,
              textAlign: 'center',
            }}
          >
            اضغط على + لاضافة كوب قهوة
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
