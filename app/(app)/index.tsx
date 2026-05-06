import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useSession } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { theme } from '@/lib/theme';

export default function WelcomeScreen() {
  const { user } = useSession();
  const { profile } = useProfile(user?.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 48,
            fontFamily: theme.fonts.arabicDecorative.bold,
            textAlign: 'center',
          }}
        >
          أهلاً بك
        </Text>

        <Text
          style={{
            color: theme.colors.text,
            fontSize: 18,
            fontFamily: theme.fonts.arabicBody.medium,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {profile?.display_name_ar ?? ''}
        </Text>

        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 13,
            fontFamily: theme.fonts.arabicBody.regular,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {profile?.username ? `@${profile.username}` : ''}
        </Text>

        <View style={{ marginTop: 80 }}>
          <Pressable
            onPress={signOut}
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.colors.error,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 14,
                fontFamily: theme.fonts.arabicBody.medium,
                textAlign: 'center',
              }}
            >
              تسجيل الخروج
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
