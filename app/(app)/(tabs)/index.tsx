import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ShareableCoffeeLogCard } from '@/components/ShareableCoffeeLogCard';
import { useFeed } from '@/lib/feed';
import { theme } from '@/lib/theme';

function FeedHeader() {
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
    </View>
  );
}

export default function FeedTab() {
  const feed = useFeed({ mode: 'public' });

  const onEndReached = useCallback(() => {
    if (feed.hasMore) feed.loadMore();
  }, [feed]);

  // Refetch on tab focus so edits/deletes from the detail screen are reflected.
  useFocusEffect(
    useCallback(() => {
      void feed.refetch();
    }, [feed.refetch]),
  );

  if (feed.loading && feed.logs.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top']}
      >
        <FeedHeader />
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
        <FeedHeader />
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
            >
              <ShareableCoffeeLogCard
                log={item}
                variant="feed"
                isLiked={liked}
                likesCount={item.likes_count ?? 0}
                onLike={() => feed.toggleLike(item.id, liked)}
              />
            </Pressable>
          );
        }}
        ListHeaderComponent={<FeedHeader />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !feed.loading ? (
            <EmptyState
              icon="coffee"
              title="لا توجد قهوات بعد"
              subtitle="ابدأ بتسجيل قهوتك الأولى لرؤيتها هنا"
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
