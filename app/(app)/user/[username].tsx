import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoffeeLogCard } from '@/components/CoffeeLogCard';
import { EmptyState } from '@/components/EmptyState';
import { useSession } from '@/lib/auth';
import { fetchUserLikedIds } from '@/lib/feed';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import type { CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

type PublicProfile = {
  id: string;
  username: string;
  display_name_ar: string;
  city: string | null;
  bio: string | null;
};

const LOG_SELECT_QUERY = `
  *,
  cafe:cafes(id, name_ar, city),
  profile:profiles!user_id(username, display_name_ar, city),
  log_flavor_notes(
    flavor_note:flavor_notes(id, name_ar, color_hex, emoji, level)
  ),
  likes_count:likes(count)
`;

function flattenLog(raw: RawCoffeeLogRow): CoffeeLog {
  const { log_flavor_notes, likes_count, ...rest } = raw;
  const flavor_notes = (log_flavor_notes ?? [])
    .map((entry) => entry.flavor_note)
    .filter((n): n is NonNullable<typeof n> => !!n);
  const count = Array.isArray(likes_count) ? likes_count[0]?.count ?? 0 : 0;
  return { ...rest, flavor_notes, likes_count: count };
}

function HeaderBar({ username }: { username: string }) {
  return (
    <View
      style={{
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSoft,
        backgroundColor: theme.colors.bg,
      }}
    >
      <View style={{ padding: 8, width: 22 + 16 }} />
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 14,
          color: theme.colors.muted,
          textAlign: 'center',
        }}
      >
        {`@${username}`}
      </Text>
      <Pressable hitSlop={8} onPress={() => router.back()} style={{ padding: 8 }}>
        <Feather name="arrow-right" size={22} color={theme.colors.brown} />
      </Pressable>
    </View>
  );
}

function LogoRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
      }}
    >
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 28,
          lineHeight: 28,
          fontFamily: theme.fonts.arabicDecorative.bold,
          includeFontPadding: false,
        }}
      >
        قهوة
      </Text>
      <View
        style={{
          width: 1,
          height: 14,
          backgroundColor: theme.colors.border,
          marginHorizontal: 10,
          opacity: 0.6,
          alignSelf: 'center',
        }}
      />
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 12,
          lineHeight: 14,
          fontFamily: theme.fonts.englishDisplay.italic,
          letterSpacing: 3,
          includeFontPadding: false,
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

function ProfileHeader({
  profile,
  totalLogs,
  avgRating,
  uniqueCafes,
}: {
  profile: PublicProfile;
  totalLogs: number;
  avgRating: number | null;
  uniqueCafes: number;
}) {
  const initial = profile.display_name_ar?.trim().charAt(0) ?? '';

  return (
    <View>
      <LogoRow />

      <View style={{ marginTop: 24, alignItems: 'center', paddingHorizontal: 24 }}>
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
            fontSize: 20,
            color: theme.colors.brown,
            textAlign: 'center',
          }}
        >
          {profile.display_name_ar}
        </Text>

        <Text
          style={{
            marginTop: 4,
            fontFamily: theme.fonts.arabicBody.regular,
            fontSize: 13,
            color: theme.colors.muted,
            textAlign: 'center',
          }}
        >
          {`@${profile.username}`}
        </Text>

        {profile.city ? (
          <View
            style={{
              marginTop: 10,
              alignSelf: 'center',
              backgroundColor: theme.colors.surface2,
              borderWidth: 1,
              borderColor: theme.colors.borderSoft,
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

        {profile.bio ? (
          <Text
            style={{
              marginTop: 12,
              fontFamily: theme.fonts.arabicBody.regular,
              fontSize: 13,
              color: theme.colors.textSoft,
              textAlign: 'center',
              paddingHorizontal: 32,
            }}
          >
            {profile.bio}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          marginTop: 24,
          marginHorizontal: 16,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <StatCard value={String(totalLogs)} label="كوب مسجل" />
        <StatCard
          value={avgRating !== null ? avgRating.toFixed(1) : '—'}
          label="متوسط التقييم"
        />
        <StatCard value={String(uniqueCafes)} label="مقهى زرته" />
      </View>

      <View
        style={{
          marginTop: 24,
          marginHorizontal: 24,
          height: 1,
          backgroundColor: theme.colors.borderSoft,
        }}
      />

      <Text
        style={{
          marginTop: 20,
          marginHorizontal: 20,
          marginBottom: 4,
          fontFamily: theme.fonts.arabicDisplay.semibold,
          fontSize: 15,
          color: theme.colors.brown,
          textAlign: 'right',
        }}
      >
        {`قهوات ${profile.display_name_ar}`}
      </Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [stats, setStats] = useState<{
    totalLogs: number;
    avgRating: number | null;
    uniqueCafes: number;
  }>({ totalLogs: 0, avgRating: null, uniqueCafes: 0 });
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const profileRes = await supabase
      .from('profiles')
      .select('id, username, display_name_ar, city, bio')
      .eq('username', username)
      .maybeSingle();

    if (profileRes.error) {
      setError(profileRes.error.message);
      setLoading(false);
      return;
    }
    if (!profileRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchedProfile = profileRes.data as PublicProfile;

    const logsPromise = supabase
      .from('coffee_logs')
      .select(LOG_SELECT_QUERY)
      .eq('user_id', fetchedProfile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    // Lightweight stats query over ALL public logs (not just the 20 above),
    // so totals stay accurate for users with more than 20 logs.
    const statsPromise = supabase
      .from('coffee_logs')
      .select('id, overall_rating, cafe_id')
      .eq('user_id', fetchedProfile.id)
      .eq('is_public', true);

    const likedPromise = user
      ? fetchUserLikedIds(user.id)
      : Promise.resolve<Set<string>>(new Set());

    const [logsRes, statsRes, likedSet] = await Promise.all([
      logsPromise,
      statsPromise,
      likedPromise,
    ]);

    if (logsRes.error) {
      setError(logsRes.error.message);
      setLoading(false);
      return;
    }

    const flattened = ((logsRes.data ?? []) as unknown as RawCoffeeLogRow[]).map(
      flattenLog,
    );

    const statRows = (statsRes.data ?? []) as {
      overall_rating: number | null;
      cafe_id: string | null;
    }[];
    const totalLogs = statRows.length;
    const avgRating =
      totalLogs > 0
        ? statRows.reduce((sum, r) => sum + (r.overall_rating ?? 0), 0) / totalLogs
        : null;
    const uniqueCafes = new Set(
      statRows.filter((r) => r.cafe_id).map((r) => r.cafe_id as string),
    ).size;

    setProfile(fetchedProfile);
    setLogs(flattened);
    setStats({ totalLogs, avgRating, uniqueCafes });
    setLikedLogIds(likedSet);
    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = useCallback(
    async (logId: string, currentlyLiked: boolean) => {
      if (!user) return;

      setLikedLogIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(logId);
        else next.add(logId);
        return next;
      });
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                likes_count: Math.max(0, l.likes_count + (currentlyLiked ? -1 : 1)),
              }
            : l,
        ),
      );

      try {
        if (currentlyLiked) {
          const { error: delErr } = await supabase
            .from('likes')
            .delete()
            .eq('log_id', logId)
            .eq('user_id', user.id);
          if (delErr) throw delErr;
        } else {
          const { error: insErr } = await supabase
            .from('likes')
            .insert({ log_id: logId, user_id: user.id });
          if (insErr) {
            const code = (insErr as { code?: string }).code;
            const isDuplicate =
              code === '23505' ||
              insErr.message.toLowerCase().includes('duplicate') ||
              insErr.message.toLowerCase().includes('unique');
            if (!isDuplicate) throw insErr;
          }
        }
      } catch {
        setLikedLogIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(logId);
          else next.delete(logId);
          return next;
        });
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  likes_count: Math.max(0, l.likes_count + (currentlyLiked ? 1 : -1)),
                }
              : l,
          ),
        );
      }
    },
    [user],
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top', 'bottom']}
      >
        <HeaderBar username={username ?? ''} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brown} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top', 'bottom']}
      >
        <HeaderBar username={username ?? ''} />
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
              fontFamily: theme.fonts.arabicBody.regular,
              fontSize: 14,
              color: theme.colors.muted,
              textAlign: 'center',
            }}
          >
            لم يتم العثور على هذا المستخدم
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 8 }}>
            <Text
              style={{
                color: theme.colors.orange,
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 13,
              }}
            >
              رجوع
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top', 'bottom']}
      >
        <HeaderBar username={username ?? ''} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(179, 58, 58, 0.1)',
              padding: 12,
              borderRadius: 8,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 13,
                fontFamily: theme.fonts.arabicBody.regular,
                textAlign: 'center',
              }}
            >
              فشل تحميل الملف الشخصي
            </Text>
          </View>
          <Pressable onPress={load} style={{ marginTop: 16, padding: 8 }}>
            <Text
              style={{
                color: theme.colors.orange,
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 13,
              }}
            >
              إعادة المحاولة
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      <HeaderBar username={profile.username} />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const liked = likedLogIds.has(item.id);
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/log/[id]',
                  params: { id: item.id },
                })
              }
            >
              <CoffeeLogCard
                log={item}
                variant="diary"
                isLiked={liked}
                likesCount={item.likes_count ?? 0}
                onLike={() => toggleLike(item.id, liked)}
              />
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <ProfileHeader
            profile={profile}
            totalLogs={stats.totalLogs}
            avgRating={stats.avgRating}
            uniqueCafes={stats.uniqueCafes}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="coffee"
            title="لا توجد قهوات بعد"
            subtitle="لم ينشر هذا المستخدم أي تسجيلات"
          />
        }
      />
    </SafeAreaView>
  );
}
