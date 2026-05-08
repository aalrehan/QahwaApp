import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoffeeLogCard } from '@/components/CoffeeLogCard';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import type { CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

const SELECT_QUERY = `
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

function comingSoon() {
  Alert.alert('قريباً', 'هذه الميزة ستكون متاحة قريباً');
}

function DetailLogo() {
  return (
    <View
      style={{
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
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
    </View>
  );
}

function HeaderBar({
  title,
  showActions,
  onActions,
}: {
  title: string;
  showActions: boolean;
  onActions: () => void;
}) {
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
      {/* In RTL, the visual right side is the leading edge — back belongs there. */}
      <Pressable hitSlop={8} onPress={() => router.back()} style={{ padding: 8 }}>
        <Feather name="arrow-right" size={22} color={theme.colors.brown} />
      </Pressable>

      <Text
        style={{
          fontFamily: theme.fonts.arabicDisplay.semibold,
          fontSize: 16,
          color: theme.colors.brown,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {showActions ? (
        <Pressable hitSlop={8} onPress={onActions} style={{ padding: 8 }}>
          <Feather name="more-vertical" size={22} color={theme.colors.muted} />
        </Pressable>
      ) : (
        <View style={{ padding: 8, width: 22 + 16 }} />
      )}
    </View>
  );
}

function LikeFooter({
  isLiked,
  likesCount,
  onLike,
}: {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handleLike() {
    Animated.spring(scaleAnim, {
      toValue: 1.3,
      useNativeDriver: true,
      tension: 200,
      friction: 5,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }).start();
    });
    onLike();
  }

  return (
    <View
      style={{
        marginTop: 32,
        paddingHorizontal: 24,
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 48,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSoft,
      }}
    >
      <Pressable onPress={handleLike} hitSlop={6} style={{ padding: 8, alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {isLiked ? (
            <Ionicons name="heart" size={24} color={theme.colors.error} />
          ) : (
            <Feather name="heart" size={24} color={theme.colors.muted} />
          )}
        </Animated.View>
        {likesCount > 0 ? (
          <Text
            style={{
              fontFamily: theme.fonts.arabicBody.medium,
              fontSize: 12,
              color: isLiked ? theme.colors.error : theme.colors.muted,
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            {likesCount}
          </Text>
        ) : null}
      </Pressable>
      <Pressable onPress={comingSoon} hitSlop={6} style={{ padding: 8, alignItems: 'center' }}>
        <Feather name="share-2" size={24} color={theme.colors.muted} />
      </Pressable>
    </View>
  );
}

export default function LogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [log, setLog] = useState<CoffeeLog | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const logPromise = supabase
      .from('coffee_logs')
      .select(SELECT_QUERY)
      .eq('id', id)
      .maybeSingle();

    const likedPromise = user
      ? supabase
          .from('likes')
          .select('id')
          .eq('log_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [logRes, likedRes] = await Promise.all([logPromise, likedPromise]);

    if (logRes.error) {
      setError(logRes.error.message);
      setLoading(false);
      return;
    }
    if (!logRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const flat = flattenLog(logRes.data as unknown as RawCoffeeLogRow);
    setLog(flat);
    setLikesCount(flat.likes_count);
    setIsLiked(!!likedRes.data);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  // Optimistic like toggle (mirrors lib/feed toggleLike but local to the detail screen).
  const toggleLike = useCallback(async () => {
    if (!user || !log) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));

    try {
      if (wasLiked) {
        const { error: delErr } = await supabase
          .from('likes')
          .delete()
          .eq('log_id', log.id)
          .eq('user_id', user.id);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from('likes')
          .insert({ log_id: log.id, user_id: user.id });
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
      setIsLiked(wasLiked);
      setLikesCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    }
  }, [user, log, isLiked]);

  function handleEdit() {
    if (!log) return;
    router.push({ pathname: '/(app)/log/new', params: { editId: log.id } });
  }

  function handleDelete() {
    if (!log) return;
    Alert.alert('حذف التسجيل', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          setDeleting(true);
          const { error: delErr } = await supabase
            .from('coffee_logs')
            .delete()
            .eq('id', log.id)
            .eq('user_id', user.id);
          if (delErr) {
            setDeleting(false);
            Alert.alert('خطأ', 'فشل الحذف، حاول مجدداً');
            return;
          }
          setDeleting(false);
          router.back();
        },
      },
    ]);
  }

  function showActionSheet() {
    Alert.alert('خيارات', '', [
      { text: 'تعديل', onPress: handleEdit },
      { text: 'حذف', style: 'destructive', onPress: handleDelete },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  }

  const isOwn = !!log && !!user && log.user_id === user.id;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      <HeaderBar
        title="تفاصيل القهوة"
        showActions={isOwn}
        onActions={showActionSheet}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brown} />
        </View>
      ) : error ? (
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
              فشل تحميل القهوة
            </Text>
          </View>
          <Pressable onPress={fetchDetail} style={{ marginTop: 16, padding: 8 }}>
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
      ) : notFound || !log ? (
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
            لم يتم العثور على هذا التسجيل
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
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <DetailLogo />
          <CoffeeLogCard
            log={log}
            variant={isOwn ? 'diary' : 'feed'}
            isLiked={isLiked}
            likesCount={likesCount}
            onLike={toggleLike}
            truncateNotes={false}
            bare
            hideActions
          />
          <LikeFooter isLiked={isLiked} likesCount={likesCount} onLike={toggleLike} />
        </ScrollView>
      )}

      {deleting ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
