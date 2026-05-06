import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useSession } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { theme } from '@/lib/theme';

export default function ProfileTab() {
  const { user } = useSession();
  const { profile } = useProfile(user?.id);

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
          ملفي الشخصي
        </Text>

        <Text
          style={{
            color: theme.colors.brown,
            fontSize: 24,
            fontFamily: theme.fonts.arabicDecorative.bold,
            textAlign: 'center',
            marginTop: 32,
          }}
        >
          {profile?.display_name_ar ?? ''}
        </Text>

        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 13,
            fontFamily: theme.fonts.arabicBody.regular,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          {profile?.username ? `@${profile.username}` : ''}
        </Text>

        {profile?.city ? (
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {profile.city}
          </Text>
        ) : null}

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
