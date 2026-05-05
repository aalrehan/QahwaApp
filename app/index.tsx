import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/lib/auth';
import { theme } from '@/lib/theme';

export default function SessionRouter() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bg,
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 96,
            fontFamily: theme.fonts.arabicDecorative.bold,
            textAlign: 'center',
          }}
        >
          قهوة
        </Text>
        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 18,
            fontFamily: theme.fonts.englishDisplay.italic,
            letterSpacing: 4,
            marginTop: 12,
          }}
        >
          QAHWA
        </Text>
        <View style={{ marginTop: 64 }}>
          <Text
            style={{
              color: theme.colors.dim,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
            }}
          >
            جارٍ التحميل...
          </Text>
        </View>
      </View>
    );
  }

  return session ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}
