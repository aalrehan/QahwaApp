import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSession } from '@/lib/auth';
import { useLogForm } from '@/lib/log-form-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const FIELD_MAX_WIDTH = 360;

const BREW_METHODS = [
  'إسبريسو',
  'V60',
  'إيروبريس',
  'كيمكس',
  'فرنش بريس',
  'تركية',
  'قهوة سعودية',
  'تقطير بارد',
  'أخرى',
];

const ORIGINS = [
  'إثيوبيا',
  'اليمن',
  'كولومبيا',
  'البرازيل',
  'كينيا',
  'رواندا',
  'غواتيمالا',
  'كوستاريكا',
  'السعودية',
  'أخرى',
];

const CITIES = [
  'الرياض',
  'جده',
  'الدمام',
  'الخبر',
  'الاحساء',
  'أخرى',
];

type CafeRow = { id: string; name_ar: string; city: string | null };

export function Step1Setup() {
  const { user } = useSession();
  const { formData, updateData } = useLogForm();

  const [cafeQuery, setCafeQuery] = useState(formData.cafe?.name_ar ?? '');
  const [searchResults, setSearchResults] = useState<CafeRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeCity, setNewCafeCity] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [savingNewCafe, setSavingNewCafe] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = cafeQuery.trim();

    if (formData.cafe && formData.cafe.name_ar === trimmed) {
      setDropdownOpen(false);
      setSearchResults([]);
      return;
    }
    if (trimmed.length === 0) {
      setSearchResults([]);
      setDropdownOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setDropdownOpen(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('cafes')
        .select('id, name_ar, city')
        .ilike('name_ar', `%${trimmed}%`)
        .limit(8);
      setSearchResults((data ?? []) as CafeRow[]);
      setSearching(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cafeQuery, formData.cafe]);

  function selectExistingCafe(cafe: CafeRow) {
    updateData({
      cafe: {
        id: cafe.id,
        name_ar: cafe.name_ar,
        city: cafe.city ?? '',
      },
    });
    setCafeQuery(cafe.name_ar);
    setDropdownOpen(false);
    setSearchResults([]);
  }

  function openCreateForm() {
    setShowCreateForm(true);
    setNewCafeName(cafeQuery.trim());
    setNewCafeCity('');
    setCreateError(null);
    setDropdownOpen(false);
  }

  function cancelCreate() {
    setShowCreateForm(false);
    setNewCafeName('');
    setNewCafeCity('');
    setCreateError(null);
  }

  async function saveNewCafe() {
    if (!user) return;
    const name = newCafeName.trim();
    if (name.length < 2 || !newCafeCity) return;
    setSavingNewCafe(true);
    setCreateError(null);
    try {
      const { data, error } = await supabase
        .from('cafes')
        .insert({ name_ar: name, city: newCafeCity, created_by: user.id })
        .select('id, name_ar, city')
        .single();
      if (error) throw error;
      updateData({
        cafe: { id: data.id, name_ar: data.name_ar, city: data.city ?? '' },
      });
      setCafeQuery(data.name_ar);
      setShowCreateForm(false);
      setSearchResults([]);
      setDropdownOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('network') || msg.includes('fetch')) {
        setCreateError('تحقق من اتصالك بالإنترنت');
      } else if (msg.includes('rls') || msg.includes('policy') || msg.includes('permission')) {
        setCreateError('خطأ في الصلاحيات، حاول لاحقاً');
      } else {
        setCreateError('تعذر إنشاء المقهى');
      }
    } finally {
      setSavingNewCafe(false);
    }
  }

  function handleQueryChange(text: string) {
    setCafeQuery(text);
    if (formData.cafe && text !== formData.cafe.name_ar) {
      updateData({ cafe: null });
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>معلومات القهوة</Text>
      <Text style={styles.subheading}>أين شربتها وماذا كانت؟</Text>

      <View style={styles.formWrap}>
        {/* FIELD 1: Café */}
        <Text style={styles.label}>المقهى</Text>
        <TextInput
          value={cafeQuery}
          onChangeText={handleQueryChange}
          placeholder="ابحث عن مقهاك"
          placeholderTextColor={theme.colors.dim}
          editable={!showCreateForm}
          style={[styles.input, { textAlign: 'right' }]}
        />

        {dropdownOpen && !showCreateForm && (
          <View style={styles.dropdown}>
            {searching && (
              <View style={{ padding: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.muted} />
              </View>
            )}
            {!searching && searchResults.length > 0 && (
              <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                {searchResults.map((cafe) => (
                  <Pressable
                    key={cafe.id}
                    onPress={() => selectExistingCafe(cafe)}
                    style={styles.dropdownItem}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: theme.fonts.arabicBody.medium,
                        color: theme.colors.brown,
                        textAlign: 'right',
                      }}
                    >
                      {cafe.name_ar}
                    </Text>
                    {cafe.city ? (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: theme.fonts.arabicBody.regular,
                          color: theme.colors.muted,
                          textAlign: 'right',
                          marginTop: 2,
                        }}
                      >
                        {cafe.city}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {!searching && searchResults.length === 0 && cafeQuery.trim().length > 0 && (
              <Pressable onPress={openCreateForm} style={styles.dropdownItem}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: theme.fonts.arabicBody.medium,
                    color: theme.colors.orange,
                    textAlign: 'right',
                  }}
                >
                  لم يتم العثور على المقهى. اضغط للإنشاء
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {showCreateForm && (
          <View style={styles.createBox}>
            <Text
              style={{
                color: theme.colors.brown,
                fontSize: 14,
                fontFamily: theme.fonts.arabicDisplay.medium,
                marginBottom: 12,
                textAlign: 'right',
              }}
            >
              إنشاء مقهى جديد
            </Text>

            <Text style={styles.label}>اسم المقهى بالعربية</Text>
            <TextInput
              value={newCafeName}
              onChangeText={setNewCafeName}
              placeholder="مقهى ..."
              placeholderTextColor={theme.colors.dim}
              maxLength={80}
              editable={!savingNewCafe}
              style={[styles.input, { textAlign: 'right' }]}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>المدينة</Text>
            <Pressable
              onPress={() => setCityModalVisible(true)}
              disabled={savingNewCafe}
              style={[
                styles.input,
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
              ]}
            >
              <Text style={{ fontSize: 15, color: theme.colors.muted }}>▾</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: theme.fonts.arabicBody.regular,
                  color: newCafeCity ? theme.colors.text : theme.colors.dim,
                }}
              >
                {newCafeCity || 'اختر المدينة'}
              </Text>
            </Pressable>

            {createError && (
              <Text
                style={{
                  color: theme.colors.error,
                  fontSize: 12,
                  fontFamily: theme.fonts.arabicBody.regular,
                  textAlign: 'center',
                  marginTop: 12,
                }}
              >
                {createError}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Pressable
                onPress={cancelCreate}
                disabled={savingNewCafe}
                style={{
                  flex: 0.4,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.brown,
                    fontFamily: theme.fonts.arabicBody.medium,
                    fontSize: 13,
                  }}
                >
                  إلغاء
                </Text>
              </Pressable>
              <Pressable
                onPress={saveNewCafe}
                disabled={
                  savingNewCafe ||
                  newCafeName.trim().length < 2 ||
                  !newCafeCity
                }
                style={{
                  flex: 0.6,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: theme.colors.orange,
                  alignItems: 'center',
                  opacity:
                    savingNewCafe ||
                    newCafeName.trim().length < 2 ||
                    !newCafeCity
                      ? 0.5
                      : 1,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.bg,
                    fontFamily: theme.fonts.arabicBody.bold,
                    fontSize: 13,
                  }}
                >
                  {savingNewCafe ? 'جارٍ الحفظ...' : 'حفظ'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {formData.cafe && formData.cafe.id && !showCreateForm && (
          <Text
            style={{
              marginTop: 6,
              fontSize: 11,
              fontFamily: theme.fonts.arabicBody.regular,
              color: theme.colors.success,
              textAlign: 'right',
            }}
          >
            {`✓ ${formData.cafe.name_ar}${formData.cafe.city ? ` — ${formData.cafe.city}` : ''}`}
          </Text>
        )}

        {/* FIELD 2: Drink name */}
        <Text style={[styles.label, { marginTop: 24 }]}>اسم المشروب</Text>
        <Text style={styles.helper}>مثال: إثيوبي يرغاتشيف V60</Text>
        <TextInput
          value={formData.drinkName}
          onChangeText={(t) => updateData({ drinkName: t })}
          placeholder="اسم المشروب"
          placeholderTextColor={theme.colors.dim}
          autoCapitalize="none"
          maxLength={100}
          style={[styles.input, { textAlign: 'right' }]}
        />

        {/* FIELD 3: Brew method */}
        <Text style={[styles.label, { marginTop: 24 }]}>طريقة التحضير</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {BREW_METHODS.map((method) => {
            const selected = formData.brewMethod === method;
            return (
              <Pressable
                key={method}
                onPress={() => updateData({ brewMethod: selected ? '' : method })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {method}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* FIELD 4: Origin (optional) */}
        <Text style={[styles.label, { marginTop: 24 }]}>المنشأ (اختياري)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {ORIGINS.map((o) => {
            const selected = formData.origin === o;
            return (
              <Pressable
                key={o}
                onPress={() => updateData({ origin: selected ? '' : o })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* City picker for new café */}
      <Modal
        visible={cityModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={Platform.OS !== 'ios'}
        onRequestClose={() => setCityModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: Platform.OS !== 'ios' ? 'rgba(0,0,0,0.4)' : undefined,
            justifyContent: 'flex-end',
          }}
          onPress={() => setCityModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: Platform.OS !== 'ios' ? 20 : 0,
              borderTopRightRadius: Platform.OS !== 'ios' ? 20 : 0,
              paddingBottom: 32,
            }}
            onPress={() => {}}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.borderSoft,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.fonts.arabicDisplay.medium,
                  color: theme.colors.text,
                }}
              >
                اختر المدينة
              </Text>
            </View>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setNewCafeCity(c);
                  setCityModalVisible(false);
                }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.borderSoft,
                  backgroundColor: newCafeCity === c ? theme.colors.surface2 : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: theme.fonts.arabicBody.medium,
                    color: newCafeCity === c ? theme.colors.brown : theme.colors.text,
                    textAlign: 'right',
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = {
  heading: {
    color: theme.colors.brown,
    fontSize: 22,
    fontFamily: theme.fonts.arabicDisplay.bold,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subheading: {
    color: theme.colors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.arabicBody.regular,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  formWrap: {
    width: '100%' as const,
    maxWidth: FIELD_MAX_WIDTH,
    alignSelf: 'center' as const,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.arabicBody.medium,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  helper: {
    color: theme.colors.dim,
    fontSize: 11,
    fontFamily: theme.fonts.arabicBody.regular,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: theme.fonts.arabicBody.regular,
    color: theme.colors.text,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden' as const,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  createBox: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: theme.colors.orange,
    borderColor: theme.colors.orange,
  },
  chipText: {
    fontSize: 13,
    fontFamily: theme.fonts.arabicBody.medium,
    color: theme.colors.textSoft,
  },
  chipTextSelected: {
    color: theme.colors.bg,
  },
} as const;
