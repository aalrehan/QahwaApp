import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShareableCoffeeLogCard } from '@/components/ShareableCoffeeLogCard';
import { useCafeLogs, useCafeSearch, useTopCafes } from '@/lib/discover';
import type { CafeWithCount } from '@/lib/discover';
import { theme } from '@/lib/theme';

// ─── Logo row (same as other tabs) ───────────────────────────────────────────

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

// ─── Cafe row card ────────────────────────────────────────────────────────────

function CafeCard({ cafe, onPress }: { cafe: CafeWithCount; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      })}
    >
      {/* Chevron on the left since layout is RTL */}
      <Feather name="chevron-left" size={16} color={theme.colors.dim} style={{ marginLeft: 4 }} />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: theme.fonts.arabicDisplay.semibold,
            fontSize: 15,
            color: theme.colors.brownDeep,
            textAlign: 'right',
          }}
        >
          {cafe.name_ar}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 4,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.arabicBody.regular,
              fontSize: 12,
              color: theme.colors.muted,
            }}
          >
            {cafe.log_count} سجل
          </Text>
          {cafe.city ? (
            <>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: theme.colors.dim,
                }}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.regular,
                  fontSize: 12,
                  color: theme.colors.muted,
                }}
              >
                {cafe.city}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Search / Top-cafes list view ─────────────────────────────────────────────

function SearchView({ onSelectCafe }: { onSelectCafe: (cafe: CafeWithCount) => void }) {
  const [query, setQuery] = useState('');
  const { cafes: topCafes, loading: topLoading } = useTopCafes();
  const { cafes: searchResults, loading: searchLoading } = useCafeSearch(query);

  const isSearching = query.trim().length > 0;
  const displayCafes = isSearching ? searchResults : topCafes;
  const isLoading = isSearching ? searchLoading : topLoading;

  return (
    <FlatList
      data={displayCafes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CafeCard cafe={item} onPress={() => onSelectCafe(item)} />
      )}
      ListHeaderComponent={
        <View>
          <LogoRow />

          {/* Search bar */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 24,
              marginBottom: 8,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x" size={16} color={theme.colors.muted} />
              </Pressable>
            ) : (
              <Feather name="search" size={16} color={theme.colors.muted} />
            )}
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن مقهى..."
              placeholderTextColor={theme.colors.dim}
              style={{
                flex: 1,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 15,
                color: theme.colors.text,
                textAlign: 'right',
                paddingVertical: 12,
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {/* Section heading */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicDisplay.semibold,
                fontSize: 16,
                color: theme.colors.brown,
              }}
            >
              {isSearching ? 'نتائج البحث' : 'المقاهي الأكثر نشاطاً'}
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator
              color={theme.colors.brown}
              style={{ marginVertical: 24 }}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoading ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 32,
              paddingHorizontal: 32,
            }}
          >
            <Feather name="coffee" size={32} color={theme.colors.dim} />
            <Text
              style={{
                marginTop: 12,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
              }}
            >
              {isSearching ? 'لا توجد مقاهٍ بهذا الاسم' : 'لا توجد مقاهٍ بعد'}
            </Text>
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

// ─── Per-cafe log browser ─────────────────────────────────────────────────────

function CafeLogsView({
  cafe,
  onBack,
}: {
  cafe: CafeWithCount;
  onBack: () => void;
}) {
  const { logs, likedLogIds, loading, hasMore, loadMore, toggleLike } = useCafeLogs(cafe.id);

  const onEndReached = useCallback(() => {
    if (hasMore) void loadMore();
  }, [hasMore, loadMore]);

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const liked = likedLogIds.has(item.id);
        return (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/log/[id]', params: { id: item.id } })
            }
          >
            <ShareableCoffeeLogCard
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
          {/* Back + cafe name header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            <Pressable onPress={onBack} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="arrow-left" size={22} color={theme.colors.brown} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontFamily: theme.fonts.arabicDisplay.bold,
                fontSize: 18,
                color: theme.colors.brown,
                textAlign: 'center',
                marginRight: 30, // balance the back button
              }}
              numberOfLines={1}
            >
              {cafe.name_ar}
            </Text>
          </View>

          {/* City + log count pill */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 12,
                color: theme.colors.muted,
              }}
            >
              {cafe.log_count} سجل قهوة
            </Text>
            {cafe.city ? (
              <>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: theme.colors.dim,
                  }}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 12,
                    color: theme.colors.muted,
                  }}
                >
                  {cafe.city}
                </Text>
              </>
            ) : null}
          </View>

          {loading && logs.length === 0 ? (
            <ActivityIndicator
              color={theme.colors.brown}
              style={{ marginVertical: 40 }}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 32,
              paddingHorizontal: 32,
            }}
          >
            <Feather name="coffee" size={32} color={theme.colors.dim} />
            <Text
              style={{
                marginTop: 12,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
              }}
            >
              لا توجد قهوات مسجلة لهذا المقهى
            </Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        loading && logs.length > 0 ? (
          <ActivityIndicator color={theme.colors.brown} style={{ padding: 20 }} />
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function DiscoverTab() {
  const [selectedCafe, setSelectedCafe] = useState<CafeWithCount | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {selectedCafe ? (
        <CafeLogsView cafe={selectedCafe} onBack={() => setSelectedCafe(null)} />
      ) : (
        <SearchView onSelectCafe={setSelectedCafe} />
      )}
    </SafeAreaView>
  );
}
