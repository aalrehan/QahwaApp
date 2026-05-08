import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { groupFlavorNotes, useFlavorNotes, type FlavorNote } from '@/lib/flavor-notes';
import { useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const MAX_FLAVORS = 5;

function colorFor(note: FlavorNote, parent: FlavorNote | undefined): string {
  return note.color_hex || parent?.color_hex || theme.colors.muted;
}

export function Step5Flavors() {
  const { formData, updateData } = useLogForm();
  const selectedIds = formData.flavorNoteIds ?? [];

  const { notes, loading, error, refetch } = useFlavorNotes();
  const index = useMemo(() => groupFlavorNotes(notes), [notes]);

  const [activePath, setActivePath] = useState<string[]>([]);
  const [maxBanner, setMaxBanner] = useState(false);

  useEffect(() => {
    if (!maxBanner) return;
    const t = setTimeout(() => setMaxBanner(false), 1800);
    return () => clearTimeout(t);
  }, [maxBanner]);

  const currentChips: FlavorNote[] = useMemo(() => {
    if (notes.length === 0) return [];
    if (activePath.length === 0) return index.primaries;
    const last = activePath[activePath.length - 1];
    return index.getChildren(last);
  }, [notes, activePath, index]);

  const breadcrumb = useMemo(() => {
    return activePath
      .map((id) => index.getById(id))
      .filter((n): n is FlavorNote => !!n);
  }, [activePath, index]);

  const selectedNotes = useMemo(
    () =>
      selectedIds
        .map((id) => index.getById(id))
        .filter((n): n is FlavorNote => !!n),
    [selectedIds, index],
  );

  function toggleSelect(note: FlavorNote) {
    if (selectedIds.includes(note.id)) {
      updateData({ flavorNoteIds: selectedIds.filter((x) => x !== note.id) });
      return;
    }
    if (selectedIds.length >= MAX_FLAVORS) {
      setMaxBanner(true);
      return;
    }
    updateData({ flavorNoteIds: [...selectedIds, note.id] });
  }

  function removeSelected(id: string) {
    updateData({ flavorNoteIds: selectedIds.filter((x) => x !== id) });
  }

  function handleChipTap(note: FlavorNote) {
    const children = index.getChildren(note.id);
    if (children.length > 0) {
      setActivePath([...activePath, note.id]);
      return;
    }
    toggleSelect(note);
  }

  function goBack() {
    setActivePath(activePath.slice(0, -1));
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <ActivityIndicator size="small" color={theme.colors.brown} />
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
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
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
            فشل تحميل النكهات، حاول لاحقاً
          </Text>
        </View>
        <Pressable onPress={refetch} style={{ marginTop: 16, padding: 8 }}>
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
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 24,
          fontFamily: theme.fonts.arabicDisplay.bold,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        النكهات
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        اختر النكهات التي تذوقتها
      </Text>

      {/* Selected tray */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderSoft,
          borderRadius: 16,
          padding: 12,
          marginBottom: 20,
          minHeight: 64,
          justifyContent: 'center',
        }}
      >
        {selectedNotes.length === 0 ? (
          <Text
            style={{
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
              color: theme.colors.muted,
              textAlign: 'center',
            }}
          >
            اختر حتى 5 نكهات
          </Text>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: theme.fonts.arabicBody.regular,
                color: theme.colors.muted,
              }}
            >
              {`${selectedNotes.length} / ${MAX_FLAVORS}`}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
              style={{ flex: 1 }}
            >
              {selectedNotes.map((note) => {
                const parent = note.parent_id
                  ? index.getById(note.parent_id)
                  : undefined;
                return (
                  <View
                    key={note.id}
                    style={{
                      backgroundColor: theme.colors.surface2,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {note.emoji ? (
                      <Text style={{ fontSize: 14 }}>{note.emoji}</Text>
                    ) : (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: colorFor(note, parent),
                        }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: theme.fonts.arabicBody.medium,
                        color: theme.colors.text,
                      }}
                    >
                      {note.name_ar}
                    </Text>
                    <Pressable
                      onPress={() => removeSelected(note.id)}
                      hitSlop={6}
                      style={{ padding: 2 }}
                    >
                      <Feather name="x" size={14} color={theme.colors.muted} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Active level navigator */}
      {breadcrumb.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Pressable onPress={goBack} hitSlop={8} style={{ padding: 8 }}>
            <Feather name="arrow-right" size={20} color={theme.colors.brown} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontFamily: theme.fonts.arabicBody.medium,
              fontSize: 14,
              textAlign: 'right',
            }}
          >
            {breadcrumb.map((n, i) => (
              <Text
                key={n.id}
                style={{
                  color:
                    i === breadcrumb.length - 1
                      ? theme.colors.brown
                      : theme.colors.muted,
                }}
              >
                {i > 0 ? ' ‹ ' : ''}
                {n.name_ar}
              </Text>
            ))}
          </Text>
        </View>
      )}

      {/* Max-flavors banner */}
      {maxBanner && (
        <View
          style={{
            backgroundColor: 'rgba(179, 58, 58, 0.1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: theme.colors.error,
              fontSize: 12,
              fontFamily: theme.fonts.arabicBody.medium,
              textAlign: 'center',
            }}
          >
            الحد الأقصى 5 نكهات
          </Text>
        </View>
      )}

      {/* Chips grid */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'flex-start',
        }}
      >
        {currentChips.map((note) => {
          const hasChildren = index.getChildren(note.id).length > 0;
          const selected = selectedIds.includes(note.id);
          const parent = note.parent_id
            ? index.getById(note.parent_id)
            : undefined;
          return (
            <Pressable
              key={note.id}
              onPress={() => handleChipTap(note)}
              android_ripple={{ color: theme.colors.surface2 }}
              style={{
                alignItems: 'center',
                padding: 12,
                minWidth: 80,
                backgroundColor: selected
                  ? theme.colors.surface2
                  : theme.colors.surface,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.brown
                  : theme.colors.borderSoft,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOpacity: selected ? 0.08 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: selected ? 1 : 0,
              }}
            >
              {note.level === 1 && note.emoji ? (
                <Text style={{ fontSize: 22, marginBottom: 4 }}>
                  {note.emoji}
                </Text>
              ) : (
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: colorFor(note, parent),
                    marginBottom: 6,
                  }}
                />
              )}
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.medium,
                  fontSize: 12,
                  color: selected ? theme.colors.brown : theme.colors.textSoft,
                  textAlign: 'center',
                }}
              >
                {note.name_ar}
              </Text>
              {hasChildren && (
                <View style={{ position: 'absolute', top: 6, left: 6 }}>
                  <Feather
                    name="chevron-left"
                    size={14}
                    color={theme.colors.muted}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
