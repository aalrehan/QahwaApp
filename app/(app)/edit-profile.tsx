import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/auth';
import { checkUsernameAvailable, updateProfile, useProfile } from '@/lib/profile';
import { theme } from '@/lib/theme';

const CITIES = ['الرياض', 'جده', 'الدمام', 'الخبر', 'الاحساء', 'أخرى'];

const USERNAME_REGEX = /^[a-z0-9_]+$/;
const BIO_MAX = 120;
const NAME_AR_MIN = 2;
const NAME_AR_MAX = 50;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

type UsernameStatus = 'idle' | 'short' | 'invalid' | 'checking' | 'available' | 'taken';

function mapSaveError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique') || m.includes('23505')) {
    return 'اسم المستخدم هذا مأخوذ';
  }
  if (m.includes('network') || m.includes('fetch')) return 'تحقق من اتصالك بالإنترنت';
  if (m.includes('rls') || m.includes('policy') || m.includes('permission')) {
    return 'خطأ في الصلاحيات';
  }
  return 'فشل الحفظ، حاول مجدداً';
}

function LogoRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
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

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: theme.fonts.arabicBody.medium,
        fontSize: 12,
        color: theme.colors.muted,
        textAlign: 'right',
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function FieldError({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <Text
      style={{
        marginTop: 4,
        fontFamily: theme.fonts.arabicBody.regular,
        fontSize: 12,
        color: theme.colors.error,
        textAlign: 'right',
      }}
    >
      {children}
    </Text>
  );
}

export default function EditProfileScreen() {
  const { user } = useSession();
  const { profile, loading: profileLoading, refetch } = useProfile(user?.id);

  const [displayNameAr, setDisplayNameAr] = useState('');
  const [username, setUsername] = useState('');
  const [displayNameEn, setDisplayNameEn] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const populatedRef = useRef(false);
  const originalUsernameRef = useRef('');
  const nameInputRef = useRef<TextInput>(null);

  // Pre-fill once profile arrives.
  useEffect(() => {
    if (!profile || populatedRef.current) return;
    setDisplayNameAr(profile.display_name_ar ?? '');
    setUsername(profile.username ?? '');
    setDisplayNameEn(profile.display_name ?? '');
    setCity(profile.city ?? '');
    setBio(profile.bio ?? '');
    originalUsernameRef.current = profile.username ?? '';
    setUsernameStatus('available');
    populatedRef.current = true;
  }, [profile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      displayNameAr !== (profile.display_name_ar ?? '') ||
      username !== (profile.username ?? '') ||
      displayNameEn !== (profile.display_name ?? '') ||
      city !== (profile.city ?? '') ||
      bio !== (profile.bio ?? '')
    );
  }, [profile, displayNameAr, username, displayNameEn, city, bio]);

  const handleDiscard = useCallback(() => {
    if (!hasChanges) {
      router.back();
      return;
    }
    Alert.alert('تجاهل التغييرات؟', 'لديك تغييرات غير محفوظة.', [
      { text: 'تجاهل', style: 'destructive', onPress: () => router.back() },
      { text: 'متابعة التعديل', style: 'cancel' },
    ]);
  }, [hasChanges]);

  // Android hardware back: same discard logic.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasChanges) {
        Alert.alert('تجاهل التغييرات؟', 'لديك تغييرات غير محفوظة.', [
          { text: 'تجاهل', style: 'destructive', onPress: () => router.back() },
          { text: 'متابعة التعديل', style: 'cancel' },
        ]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [hasChanges]);

  function handleUsernameChange(text: string) {
    const cleaned = text.toLowerCase().replace(/\s/g, '').slice(0, USERNAME_MAX);
    setUsername(cleaned);
    setUsernameError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!cleaned) {
      setUsernameStatus('idle');
      return;
    }
    // If user re-typed their original username, skip the availability call
    // (their own row would otherwise come back as "taken").
    if (cleaned === originalUsernameRef.current) {
      setUsernameStatus('available');
      return;
    }
    if (cleaned.length < USERNAME_MIN) {
      setUsernameStatus('short');
      return;
    }
    if (!USERNAME_REGEX.test(cleaned)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(cleaned);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
  }

  async function handleSave() {
    if (!user) return;
    setNameError(null);
    setUsernameError(null);

    // Validate
    const trimmedName = displayNameAr.trim();
    if (trimmedName.length < NAME_AR_MIN || trimmedName.length > NAME_AR_MAX) {
      setNameError('الاسم مطلوب ويجب أن يكون بين 2 و50 حرف');
      nameInputRef.current?.focus();
      return;
    }
    if (usernameStatus !== 'available') {
      if (usernameStatus === 'short') {
        setUsernameError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      } else if (usernameStatus === 'invalid') {
        setUsernameError('فقط حروف إنجليزية وأرقام و (_)');
      } else if (usernameStatus === 'taken') {
        setUsernameError('اسم المستخدم هذا مأخوذ، جرب غيره');
      } else if (usernameStatus === 'checking') {
        return; // wait for the check to settle
      } else {
        setUsernameError('اسم المستخدم مطلوب');
      }
      return;
    }
    if (!city) {
      Alert.alert('المدينة مطلوبة', 'اختر مدينتك للمتابعة');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, {
        display_name_ar: trimmedName,
        display_name: displayNameEn.trim() || null,
        username: username.trim().toLowerCase(),
        city,
        bio: bio.trim() || null,
      });

      await refetch();
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const mapped = mapSaveError(message);
      setSaving(false);
      if (mapped.includes('مأخوذ')) {
        setUsernameError(mapped);
        setUsernameStatus('taken');
      } else {
        Alert.alert('خطأ', mapped);
      }
    }
  }

  const initial = (profile?.display_name_ar ?? '').trim().charAt(0);

  const trimmedNameValid =
    displayNameAr.trim().length >= NAME_AR_MIN &&
    displayNameAr.trim().length <= NAME_AR_MAX;
  const formValid =
    trimmedNameValid && usernameStatus === 'available' && city !== '';
  const saveEnabled = hasChanges && formValid && !saving;

  if (profileLoading && !profile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top', 'bottom']}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brown} />
        </View>
      </SafeAreaView>
    );
  }

  const bioCounterColor =
    bio.length >= BIO_MAX
      ? theme.colors.error
      : bio.length >= 100
        ? theme.colors.orange
        : theme.colors.dim;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      {/* HEADER */}
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
        <Pressable hitSlop={8} onPress={handleDiscard} style={{ padding: 8 }}>
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
          تعديل الملف الشخصي
        </Text>

        <Pressable
          hitSlop={8}
          disabled={!saveEnabled}
          onPress={handleSave}
          style={{ padding: 8, minWidth: 56, alignItems: 'center' }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.orange} />
          ) : justSaved ? (
            <Feather name="check" size={20} color={theme.colors.success} />
          ) : (
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 15,
                color: saveEnabled ? theme.colors.orange : theme.colors.dim,
              }}
            >
              حفظ
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <LogoRow />

          {/* AVATAR */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: theme.colors.surface2,
                borderWidth: 2,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.arabicDecorative.bold,
                  fontSize: 32,
                  color: theme.colors.brown,
                  includeFontPadding: false,
                }}
              >
                {initial}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() =>
                Alert.alert('قريباً', 'رفع الصور سيكون متاحاً قريباً')
              }
              style={{ marginTop: 12, padding: 4 }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.arabicBody.medium,
                  fontSize: 13,
                  color: theme.colors.orange,
                }}
              >
                تغيير الصورة
              </Text>
            </Pressable>
          </View>

          {/* FIELDS */}
          <View style={{ marginTop: 32, paddingHorizontal: 20, gap: 24 }}>
            {/* Arabic display name */}
            <View>
              <FieldLabel>الاسم بالعربي *</FieldLabel>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: nameError ? theme.colors.error : theme.colors.borderSoft,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  ref={nameInputRef}
                  value={displayNameAr}
                  onChangeText={(t) => {
                    setDisplayNameAr(t);
                    setNameError(null);
                  }}
                  placeholder="اسمك كما تريد أن يظهر"
                  placeholderTextColor={theme.colors.dim}
                  autoCorrect={false}
                  maxLength={NAME_AR_MAX}
                  editable={!saving}
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: theme.colors.text,
                    textAlign: 'right',
                    padding: 0,
                  }}
                />
              </View>
              <FieldError>{nameError}</FieldError>
            </View>

            {/* Username */}
            <View>
              <FieldLabel>اسم المستخدم *</FieldLabel>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: usernameError ? theme.colors.error : theme.colors.borderSoft,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  direction: 'ltr',
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: theme.colors.dim,
                    marginRight: 4,
                  }}
                >
                  @
                </Text>
                <TextInput
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="coffee_lover"
                  placeholderTextColor={theme.colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={USERNAME_MAX}
                  editable={!saving}
                  style={{
                    flex: 1,
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: theme.colors.text,
                    textAlign: 'left',
                    padding: 0,
                  }}
                />
                {/* Status icon */}
                {usernameStatus === 'checking' ? (
                  <ActivityIndicator size="small" color={theme.colors.muted} />
                ) : usernameStatus === 'available' ? (
                  <Feather name="check" size={16} color={theme.colors.success} />
                ) : usernameStatus === 'invalid' ||
                  usernameStatus === 'taken' ||
                  usernameStatus === 'short' ? (
                  <Feather name="x" size={16} color={theme.colors.error} />
                ) : null}
              </View>
              <FieldError>
                {usernameError ??
                  (usernameStatus === 'short'
                    ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
                    : usernameStatus === 'invalid'
                      ? 'فقط حروف إنجليزية وأرقام و (_)'
                      : usernameStatus === 'taken'
                        ? 'اسم المستخدم هذا مأخوذ، جرب غيره'
                        : null)}
              </FieldError>
            </View>

            {/* English name (optional) */}
            <View>
              <FieldLabel>الاسم بالإنجليزي (اختياري)</FieldLabel>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={displayNameEn}
                  onChangeText={setDisplayNameEn}
                  placeholder="Your name in English"
                  placeholderTextColor={theme.colors.dim}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  editable={!saving}
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: theme.colors.text,
                    textAlign: 'left',
                    padding: 0,
                  }}
                />
              </View>
            </View>

            {/* City */}
            <View>
              <FieldLabel>المدينة *</FieldLabel>
              <Pressable
                onPress={() => setCityModalVisible(true)}
                disabled={saving}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Feather name="chevron-down" size={16} color={theme.colors.muted} />
                <Text
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: city ? theme.colors.text : theme.colors.dim,
                    textAlign: 'right',
                    flex: 1,
                    marginLeft: 8,
                  }}
                >
                  {city || 'اختر مدينتك'}
                </Text>
              </Pressable>
            </View>

            {/* Bio */}
            <View>
              <FieldLabel>نبذة عنك (اختياري)</FieldLabel>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  minHeight: 88,
                }}
              >
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="اكتب جملة أو جملتين عن شغفك بالقهوة..."
                  placeholderTextColor={theme.colors.dim}
                  multiline
                  numberOfLines={3}
                  maxLength={BIO_MAX}
                  editable={!saving}
                  style={{
                    fontFamily: theme.fonts.arabicBody.regular,
                    fontSize: 15,
                    color: theme.colors.text,
                    textAlign: 'right',
                    textAlignVertical: 'top',
                    padding: 0,
                    minHeight: 64,
                  }}
                />
              </View>
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: theme.fonts.arabicBody.regular,
                  fontSize: 11,
                  color: bioCounterColor,
                  textAlign: 'right',
                }}
              >
                {`${bio.length}/${BIO_MAX}`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City picker modal */}
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
                  fontFamily: theme.fonts.arabicDisplay.semibold,
                  color: theme.colors.brown,
                }}
              >
                اختر مدينتك
              </Text>
            </View>
            {CITIES.map((c) => {
              const selected = city === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCity(c);
                    setCityModalVisible(false);
                  }}
                  style={{
                    height: 52,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: selected ? theme.colors.surface2 : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.borderSoft,
                  }}
                >
                  {selected ? (
                    <Feather name="check" size={16} color={theme.colors.brown} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: theme.fonts.arabicBody.medium,
                      color: selected ? theme.colors.brown : theme.colors.text,
                      textAlign: 'right',
                      flex: 1,
                      marginLeft: 12,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
