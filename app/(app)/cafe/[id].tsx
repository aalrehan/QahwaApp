import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoffeeLogCard } from '@/components/CoffeeLogCard';
import { EmptyState } from '@/components/EmptyState';
import { useSession } from '@/lib/auth';
import { fetchUserLikedIds } from '@/lib/feed';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import type { CafeSummary, CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

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

function HeaderBar({ title }: { title: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 52,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSoft,
        backgroundColor: theme.colors.bg,
      }}
    >
      <View style={{ width: 22 + 8 }} />
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: theme.fonts.arabicDisplay.semibold,
          fontSize: 16,
          color: theme.colors.brown,
          textAlign: 'center',
        }}
      >
        {title}
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

function CafeHero({
  cafe,
  logCount,
}: {
  cafe: CafeSummary;
  logCount: number;
}) {
  const initial = cafe.name_ar?.trim().charAt(0) ?? '';
  return (
    <View
      style={{
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 24,
      }}
    >
      <LinearGradient
        colors={['#D2691E', '#6B3A1F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.arabicDecorative.bold,
            fontSize: 28,
            color: '#FFFFFF',
            includeFontPadding: false,
          }}
        >
          {initial}
        </Text>
      </LinearGradient>

      <Text
        style={{
          marginTop: 16,
          fontFamily: theme.fonts.arabicDisplay.bold,
          fontSize: 22,
          color: theme.colors.brownDeep,
          textAlign: 'center',
        }}
      >
        {cafe.name_ar}
      </Text>

      {cafe.city ? (
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
            {cafe.city}
          </Text>
        </View>
      ) : null}

      <Text
        style={{
          marginTop: 8,
          fontFamily: theme.fonts.arabicBody.regular,
          fontSize: 13,
          color: theme.colors.muted,
          textAlign: 'center',
        }}
      >
        {`${logCount} تسجيل في هذا المقهى`}
      </Text>
    </View>
  );
}

export default function CafeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [cafe, setCafe] = useState<CafeSummary | null>(null);
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const cafePromise = supabase
      .from('cafes')
      .select('id, name_ar, city')
      .eq('id', id)
      .single();

    const logsPromise = supabase
      .from('coffee_logs')
      .select(LOG_SELECT_QUERY)
      .eq('cafe_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);

    const likedPromise = user
      ? fetchUserLikedIds(user.id)
      : Promise.resolve<Set<string>>(new Set());

    const [cafeRes, logsRes, likedSet] = await Promise.all([
      cafePromise,
      logsPromise,
      likedPromise,
    ]);

    if (cafeRes.error) {
      setError(cafeRes.error.message);
      setLoading(false);
      return;
    }
    if (logsRes.error) {
      setError(logsRes.error.message);
      setLoading(false);
      return;
    }

    const flattened = ((logsRes.data ?? []) as unknown as RawCoffeeLogRow[]).map(
      flattenLog,
    );
    setCafe(cafeRes.data as CafeSummary);
    setLogs(flattened);
    setLikedLogIds(likedSet);
    setLoading(false);
  }, [id, user]);

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
            ? { ...l, likes_count: Math.max(0, l.likes_count + (currentlyLiked ? -1 : 1)) }
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
              ? { ...l, likes_count: Math.max(0, l.likes_count + (currentlyLiked ? 1 : -1)) }
              : l,
          ),
        );
      }
    },
    [user],
  );

  const title = cafe?.name_ar ?? '';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <HeaderBar title={title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brown} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !cafe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <HeaderBar title={title} />
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
              color: theme.colors.error,
              fontSize: 14,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
            }}
          >
            فشل تحميل المقهى
          </Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <HeaderBar title={title} />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const liked = likedLogIds.has(item.id);
          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(app)/log/[id]', params: { id: item.id } })
              }
            >
              <CoffeeLogCard
                log={item}
                variant="feed"
                isLiked={liked}
                likesCount={item.likes_count ?? 0}
                onLike={() => toggleLike(item.id, liked)}
              />
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View>
            <LogoRow />
            <CafeHero cafe={cafe} logCount={logs.length} />
            <View
              style={{
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
              كل التسجيلات
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="coffee"
            title="لا توجد تسجيلات بعد"
            subtitle="كن أول من يسجل تجربته في هذا المقهى"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
