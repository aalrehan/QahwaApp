import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShareableCoffeeLogCard } from '@/components/ShareableCoffeeLogCard';
import { useCafeLogs, useCafeSearch, useTopCafes } from '@/lib/discover';
import type { CafeWithCount } from '@/lib/discover';
import { theme } from '@/lib/theme';

function LogoRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 20,
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

function SearchBar({
  query,
  onChangeQuery,
}: {
  query: string;
  onChangeQuery: (q: string) => void;
}) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 28,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8DDD0',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#6B3A1F',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="ابحث عن مقهى..."
        placeholderTextColor="#B5A595"
        style={{
          flex: 1,
          fontFamily: theme.fonts.arabicBody.regular,
          fontSize: 15,
          color: '#2A1F15',
          textAlign: 'right',
          padding: 0,
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {query.length > 0 ? (
        <Pressable onPress={() => onChangeQuery('')} hitSlop={8} style={{ marginEnd: 10 }}>
          <Feather name="x" size={18} color="#8B7355" />
        </Pressable>
      ) : (
        <Feather name="search" size={20} color="#8B7355" style={{ marginEnd: 10 }} />
      )}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
      }}
    >
      <View style={{ width: 24 }} />
      <Text
        style={{
          fontFamily: theme.fonts.arabicDisplay.semibold,
          fontSize: 17,
          color: '#6B3A1F',
          textAlign: 'right',
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function CafeCard({ cafe, onPress }: { cafe: CafeWithCount; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F4E8D8' : '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8DDD0',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#6B3A1F',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#F4E8D8',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="chevron-left" size={16} color="#6B3A1F" />
      </View>

      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text
          style={{
            fontFamily: theme.fonts.arabicDisplay.bold,
            fontSize: 17,
            color: '#4A2410',
            textAlign: 'right',
            marginBottom: 6,
          }}
        >
          {cafe.name_ar}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {cafe.city ? (
            <>
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.regular,
                  fontSize: 12,
                  color: '#8B7355',
                  textAlign: 'right',
                }}
              >
                {cafe.city}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.regular,
                  fontSize: 12,
                  color: '#B5A595',
                  textAlign: 'right',
                }}
              >
                ·
              </Text>
            </>
          ) : null}
          <View
            style={{
              backgroundColor: '#F4E8D8',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 12,
                color: '#6B3A1F',
                textAlign: 'right',
              }}
            >
              {`${cafe.log_count} سجل`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <View
      style={{
        marginTop: 60,
        alignItems: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Feather name="search" size={44} color="#B5A595" style={{ marginBottom: 16 }} />
      <Text
        style={{
          fontFamily: theme.fonts.arabicDisplay.medium,
          fontSize: 16,
          color: '#8B7355',
          textAlign: 'center',
        }}
      >
        {`لا توجد نتائج لـ «${query}»`}
      </Text>
    </View>
  );
}

function SearchView({ onSelectCafe }: { onSelectCafe: (cafe: CafeWithCount) => void }) {
  const [query, setQuery] = useState('');
  const { cafes: topCafes, loading: topLoading } = useTopCafes();
  const { cafes: searchResults, loading: searchLoading } = useCafeSearch(query);

  const isSearching = query.trim().length > 0;
  const displayCafes = isSearching ? searchResults : topCafes;
  const isLoading = isSearching ? searchLoading : topLoading;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <LogoRow />

      <SearchBar query={query} onChangeQuery={setQuery} />

      <SectionHeader title={isSearching ? 'نتائج البحث' : 'المقاهي الأكثر نشاطاً'} />

      {isLoading ? (
        <ActivityIndicator color="#6B3A1F" style={{ marginVertical: 24 }} />
      ) : displayCafes.length === 0 ? (
        isSearching ? (
          <NoResults query={query} />
        ) : (
          <View style={{ marginTop: 40, alignItems: 'center', paddingHorizontal: 32 }}>
            <Feather name="coffee" size={44} color="#B5A595" style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontFamily: theme.fonts.arabicDisplay.medium,
                fontSize: 16,
                color: '#8B7355',
                textAlign: 'center',
              }}
            >
              لا توجد مقاهٍ بعد
            </Text>
          </View>
        )
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {displayCafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              onPress={() => onSelectCafe(cafe)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            <View style={{ width: 30 }} />
            <Text
              style={{
                flex: 1,
                fontFamily: theme.fonts.arabicDisplay.bold,
                fontSize: 18,
                color: '#6B3A1F',
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {cafe.name_ar}
            </Text>
            <Pressable onPress={onBack} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="arrow-right" size={22} color="#6B3A1F" />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            {cafe.city ? (
              <>
                <Text
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 12,
                    color: '#8B7355',
                    textAlign: 'right',
                  }}
                >
                  {cafe.city}
                </Text>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: '#B5A595',
                  }}
                />
              </>
            ) : null}
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 12,
                color: '#8B7355',
                textAlign: 'right',
              }}
            >
              {`${cafe.log_count} سجل قهوة`}
            </Text>
          </View>

          {loading && logs.length === 0 ? (
            <ActivityIndicator color="#6B3A1F" style={{ marginVertical: 40 }} />
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
            <Feather name="coffee" size={32} color="#B5A595" />
            <Text
              style={{
                marginTop: 12,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 14,
                color: '#8B7355',
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
          <ActivityIndicator color="#6B3A1F" style={{ padding: 20 }} />
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

export default function DiscoverTab() {
  const [selectedCafe, setSelectedCafe] = useState<CafeWithCount | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {selectedCafe ? (
          <CafeLogsView cafe={selectedCafe} onBack={() => setSelectedCafe(null)} />
        ) : (
          <SearchView onSelectCafe={setSelectedCafe} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
