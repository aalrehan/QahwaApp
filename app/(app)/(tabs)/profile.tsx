import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useSession } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { useProfileStats, type RecentLog } from '@/lib/profile-stats';
import { theme } from '@/lib/theme';

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

function formatArabicShortDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]}`;
}

function LogoRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
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
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.arabicDecorative.bold,
          fontSize: 28,
          color: theme.colors.brown,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.regular,
          fontSize: 11,
          color: theme.colors.muted,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MiniLogCard({ log }: { log: RecentLog }) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: theme.fonts.arabicDisplay.semibold,
            fontSize: 15,
            color: theme.colors.brownDeep,
            textAlign: 'right',
            includeFontPadding: false,
          }}
        >
          {log.drink_name}
        </Text>
        {log.cafe?.name_ar ? (
          <Text
            style={{
              fontFamily: theme.fonts.arabicBody.regular,
              fontSize: 12,
              color: theme.colors.muted,
              textAlign: 'right',
              marginTop: 2,
            }}
          >
            {log.cafe.name_ar}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: theme.fonts.arabicBody.regular,
            fontSize: 11,
            color: theme.colors.dim,
            textAlign: 'right',
            marginTop: 4,
          }}
        >
          {formatArabicShortDate(log.created_at)}
        </Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', direction: 'ltr', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Ionicons
              key={i}
              name={i <= log.overall_rating ? 'star' : 'star-outline'}
              size={14}
              color={i <= log.overall_rating ? theme.colors.orange : theme.colors.dim}
            />
          ))}
        </View>
        <Text
          style={{
            fontFamily: theme.fonts.arabicBody.medium,
            fontSize: 11,
            color: theme.colors.muted,
            marginTop: 4,
          }}
        >
          {`${log.overall_rating}/5`}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileTab() {
  const { user } = useSession();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile(user?.id);
  const stats = useProfileStats(user?.id);

  // Refetch on focus so changes from edit-profile are reflected immediately.
  useFocusEffect(
    useCallback(() => {
      void refetchProfile();
    }, [refetchProfile]),
  );

  const initial = profile?.display_name_ar?.trim().charAt(0) ?? '';

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.brown} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: LOGO */}
        <LogoRow />

        {/* SECTION 2: PROFILE HEADER */}
        <View style={{ marginTop: 32, alignItems: 'center', paddingHorizontal: 24 }}>
          <LinearGradient
            colors={['#E8854A', '#6B3A1F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              borderWidth: 2,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicDecorative.bold,
                fontSize: 32,
                color: '#FFFFFF',
                includeFontPadding: false,
              }}
            >
              {initial || '؟'}
            </Text>
          </LinearGradient>

          <Text
            style={{
              marginTop: 16,
              fontFamily: theme.fonts.arabicDisplay.bold,
              fontSize: 22,
              color: theme.colors.brown,
              textAlign: 'center',
            }}
          >
            {profile?.display_name_ar ?? ''}
          </Text>

          {profile?.username ? (
            <Text
              style={{
                marginTop: 6,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 13,
                color: theme.colors.muted,
                textAlign: 'center',
              }}
            >
              @{profile.username}
            </Text>
          ) : null}

          {profile?.city ? (
            <View
              style={{
                marginTop: 10,
                alignSelf: 'center',
                backgroundColor: theme.colors.surface2,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Feather name="map-pin" size={11} color={theme.colors.muted} />
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.medium,
                  fontSize: 11,
                  color: theme.colors.muted,
                }}
              >
                {profile.city}
              </Text>
            </View>
          ) : null}
        </View>

        {/* SECTION 3: STATS ROW */}
        <View
          style={{
            marginTop: 32,
            marginHorizontal: 16,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <StatCard value={String(stats.totalLogs)} label="كوب مسجل" />
          <StatCard
            value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
            label="متوسط التقييم"
          />
          <StatCard value={String(stats.uniqueCafes)} label="مقاهي تمت زيارتها" />
        </View>

        {/* SECTION 4: RECENT LOGS */}
        <View style={{ marginTop: 32 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            <Pressable onPress={() => router.push('/(app)/(tabs)/diary')} hitSlop={8}>
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.medium,
                  fontSize: 12,
                  color: theme.colors.orange,
                }}
              >
                مفكرتي
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: theme.fonts.arabicDisplay.semibold,
                fontSize: 16,
                color: theme.colors.brown,
              }}
            >
              قهواتي الأخيرة
            </Text>
          </View>

          {stats.recentLogs.length === 0 ? (
            <View
              style={{
                marginHorizontal: 16,
                padding: 24,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.borderSoft,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <Feather name="coffee" size={32} color={theme.colors.dim} />
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: theme.fonts.arabicBody.regular,
                  fontSize: 14,
                  color: theme.colors.muted,
                  textAlign: 'center',
                }}
              >
                لم تسجل أي قهوة بعد
              </Text>
            </View>
          ) : (
            stats.recentLogs.map((log) => <MiniLogCard key={log.id} log={log} />)
          )}
        </View>

        {/* SECTION 5: BADGES */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontFamily: theme.fonts.arabicDisplay.semibold,
              fontSize: 16,
              color: theme.colors.brown,
              marginBottom: 16,
              textAlign: 'right',
            }}
          >
            شاراتي
          </Text>

          {stats.badges.length === 0 ? (
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 13,
                color: theme.colors.muted,
                textAlign: 'center',
              }}
            >
              أنجز تحديات لتحصل على شارات
            </Text>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {stats.badges.map((b) => (
                <View
                  key={b.badge_id}
                  style={{
                    backgroundColor: theme.colors.surface2,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {b.badge?.icon ? (
                    <Text style={{ fontSize: 18 }}>{b.badge.icon}</Text>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: theme.fonts.arabicBody.medium,
                      fontSize: 12,
                      color: theme.colors.brown,
                    }}
                  >
                    {b.badge?.name_ar ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 6: ACTIONS */}
        <View style={{ marginTop: 40, marginHorizontal: 16, gap: 12 }}>
          <Pressable
            onPress={() => router.push('/(app)/edit-profile')}
            style={{
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Feather name="edit-2" size={16} color={theme.colors.brown} />
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 14,
                color: theme.colors.brown,
              }}
            >
              تعديل الملف الشخصي
            </Text>
          </Pressable>

          <Pressable
            onPress={signOut}
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.colors.error,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Feather name="log-out" size={16} color={theme.colors.error} />
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 14,
                color: theme.colors.error,
              }}
            >
              تسجيل الخروج
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
