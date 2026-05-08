import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoffeeLogCard } from '@/components/CoffeeLogCard';
import { EmptyState } from '@/components/EmptyState';
import { useSession } from '@/lib/auth';
import { useFeed } from '@/lib/feed';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

function DiaryHeader() {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 24,
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
          marginTop: 24,
        }}
      >
        مفكرتي
      </Text>
    </View>
  );
}

export default function DiaryTab() {
  const feed = useFeed({ mode: 'self' });
  const { user } = useSession();

  const onEndReached = useCallback(() => {
    if (feed.hasMore) feed.loadMore();
  }, [feed]);

  useFocusEffect(
    useCallback(() => {
      void feed.refetch();
    }, [feed.refetch]),
  );

  const handleLongPress = useCallback(
    (logId: string) => {
      Alert.alert('خيارات', '', [
        {
          text: 'تعديل',
          onPress: () =>
            router.push({ pathname: '/(app)/log/new', params: { editId: logId } }),
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            Alert.alert('حذف التسجيل', 'هل أنت متأكد؟', [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'حذف',
                style: 'destructive',
                onPress: async () => {
                  if (!user) return;
                  const { error: delErr } = await supabase
                    .from('coffee_logs')
                    .delete()
                    .eq('id', logId)
                    .eq('user_id', user.id);
                  if (delErr) {
                    Alert.alert('خطأ', 'فشل الحذف، حاول مجدداً');
                    return;
                  }
                  await feed.refetch();
                },
              },
            ]);
          },
        },
        { text: 'إلغاء', style: 'cancel' },
      ]);
    },
    [user, feed],
  );

  if (feed.loading && feed.logs.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top']}
      >
        <DiaryHeader />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -40,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.brown} />
          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
              color: theme.colors.muted,
            }}
          >
            جارٍ التحميل...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (feed.error && feed.logs.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top']}
      >
        <DiaryHeader />
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
              فشل تحميل القهوات
            </Text>
          </View>
          <Pressable onPress={feed.refetch} style={{ marginTop: 16, padding: 8 }}>
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
      edges={['top']}
    >
      <FlatList
        data={feed.logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const liked = feed.likedLogIds.has(item.id);
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/log/[id]',
                  params: { id: item.id },
                })
              }
              onLongPress={() => handleLongPress(item.id)}
            >
              <CoffeeLogCard
                log={item}
                variant="diary"
                isLiked={liked}
                likesCount={item.likes_count ?? 0}
                onLike={() => feed.toggleLike(item.id, liked)}
              />
            </Pressable>
          );
        }}
        ListHeaderComponent={<DiaryHeader />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !feed.loading ? (
            <EmptyState
              icon="book-open"
              title="مفكرتك فارغة"
              subtitle="ابدأ بتسجيل قهواتك"
              actionLabel="اضغط +"
            />
          ) : null
        }
        ListFooterComponent={
          feed.loading && feed.logs.length > 0 ? (
            <ActivityIndicator
              color={theme.colors.brown}
              style={{ padding: 20 }}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={feed.loading && feed.logs.length > 0}
            onRefresh={feed.refetch}
            tintColor={theme.colors.brown}
            colors={[theme.colors.brown]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}
