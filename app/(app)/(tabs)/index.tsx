import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { SkeletonCard } from '@/components/SkeletonCard';
import { useFeed } from '@/lib/feed';
import { theme } from '@/lib/theme';

function FilterPill({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        backgroundColor: active ? activeColor : theme.colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: theme.colors.borderSoft,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 13,
          color: active ? '#FFFFFF' : theme.colors.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FeedHeader({
  excludeSelf,
  onChange,
}: {
  excludeSelf: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
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

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          paddingHorizontal: 20,
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        <FilterPill
          label="الجميع"
          active={!excludeSelf}
          activeColor={theme.colors.orange}
          onPress={() => onChange(false)}
        />
        <FilterPill
          label="الآخرون"
          active={excludeSelf}
          activeColor={theme.colors.brown}
          onPress={() => onChange(true)}
        />
      </View>
    </View>
  );
}

export default function FeedTab() {
  const [excludeSelf, setExcludeSelf] = useState(true);
  const feed = useFeed({ mode: 'public', excludeSelf });

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
        <FeedHeader excludeSelf={excludeSelf} onChange={setExcludeSelf} />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </SafeAreaView>
    );
  }

  if (feed.error && feed.logs.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top']}
      >
        <FeedHeader excludeSelf={excludeSelf} onChange={setExcludeSelf} />
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
        showsVerticalScrollIndicator={false}
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
        ListHeaderComponent={
          <FeedHeader excludeSelf={excludeSelf} onChange={setExcludeSelf} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !feed.loading ? (
            excludeSelf ? (
              <EmptyState
                icon="coffee"
                title="لا توجد مشاركات من الآخرين "
                subtitle="بأذن الله المزيد في الطريق"
              />
            ) : (
              <EmptyState
                icon="coffee"
                title="لا توجد قهوات بعد"
                subtitle="كن أول من يشارك تجربته"
              />
            )
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
