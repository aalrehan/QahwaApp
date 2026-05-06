import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { checkUsernameAvailable, createProfile } from '@/lib/profile';
import { theme } from '@/lib/theme';

type Step = 'form' | 'submitting' | 'success';
type UsernameStatus = 'idle' | 'short' | 'invalid' | 'checking' | 'available' | 'taken';

const CITIES = [
  'الرياض',
  'جده',
  'الدمام',
  'الخبر',
  'الاحساء',
  'أخرى',
];

const USERNAME_REGEX = /^[a-z0-9_]+$/;
const FIELD_MAX_WIDTH = 360;

function mapProfileError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('duplicate') || m.includes('unique')) return 'اسم المستخدم محجوز';
  if (m.includes('network') || m.includes('fetch')) return 'تحقق من اتصالك بالإنترنت';
  if (m.includes('rls') || m.includes('policy') || m.includes('permission')) {
    return 'خطأ في الصلاحيات، حاول لاحقاً';
  }
  return message;
}

function usernameStatusText(status: UsernameStatus): { text: string; color: string } | null {
  switch (status) {
    case 'short':   return { text: 'قصير جداً', color: theme.colors.error };
    case 'invalid': return { text: 'أحرف وأرقام فقط', color: theme.colors.error };
    case 'checking':return { text: 'جارٍ التحقق...', color: theme.colors.muted };
    case 'available':return { text: '✓ متاح', color: theme.colors.success };
    case 'taken':   return { text: '✗ غير متاح', color: theme.colors.error };
    default:        return null;
  }
}

export default function ProfileSetupScreen() {
  const { user } = useSession();
  const [step, setStep] = useState<Step>('form');

  const [displayNameAr, setDisplayNameAr] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [city, setCity] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [displayNameEn, setDisplayNameEn] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitDisabled =
    displayNameAr.trim().length < 2 ||
    usernameStatus !== 'available' ||
    city === '' ||
    step === 'submitting';

  function handleUsernameChange(text: string) {
    const cleaned = text.toLowerCase().replace(/\s/g, '').slice(0, 20);
    setUsername(cleaned);
    setFormError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!cleaned) {
      setUsernameStatus('idle');
      return;
    }
    if (cleaned.length < 3) {
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
    }, 500);
  }

  async function handleSubmit() {
    if (submitDisabled || !user) return;
    setFormError(null);
    setStep('submitting');

    try {
      const available = await checkUsernameAvailable(username);
      if (!available) {
        setUsernameStatus('taken');
        setFormError('اسم المستخدم محجوز');
        setStep('form');
        return;
      }

      await createProfile({
        id: user.id,
        username,
        display_name_ar: displayNameAr.trim(),
        display_name: displayNameEn.trim() || null,
        city,
      });

      setStep('success');
      setTimeout(() => router.replace('/(app)'), 600);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(mapProfileError(message));
      setStep('form');
    }
  }

  if (step === 'success') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[theme.colors.orange, theme.colors.brown]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Feather name="check" size={48} color={theme.colors.bg} />
          </View>
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 24,
              fontFamily: theme.fonts.arabicDecorative.bold,
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            تم التسجيل بنجاح
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSubmitting = step === 'submitting';
  const statusHint = usernameStatusText(usernameStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text
              style={{
                color: theme.colors.brown,
                fontSize: 36,
                fontFamily: theme.fonts.arabicDecorative.bold,
                textAlign: 'center',
              }}
            >
              قهوة
            </Text>
          </View>

          {/* Heading */}
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 22,
              fontFamily: theme.fonts.arabicDisplay.bold,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            أنشئ ملفك الشخصي
          </Text>
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            أخبرنا عن نفسك
          </Text>

          {/* Form */}
          <View
            style={{
              marginTop: 32,
              width: '100%',
              maxWidth: FIELD_MAX_WIDTH,
              alignSelf: 'center',
            }}
          >
            {/* Field 1: Arabic display name */}
            <Text style={styles.label}>اسمك بالعربية</Text>
            <TextInput
              value={displayNameAr}
              onChangeText={(t) => { setDisplayNameAr(t); setFormError(null); }}
              placeholder="عبدالرحمن صالح"
              placeholderTextColor={theme.colors.dim}
              autoCapitalize="words"
              maxLength={50}
              editable={!isSubmitting}
              style={[styles.input, { textAlign: 'right' }]}
            />

            {/* Field 2: Username */}
            <Text style={[styles.label, { marginTop: 20 }]}>اسم المستخدم</Text>
            <Text style={styles.helper}>بالإنجليزية فقط، 3-20 حرف</Text>
            <View
              style={{
                flexDirection: 'row',
                direction: 'ltr',
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                overflow: 'hidden',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: theme.fonts.arabicBody.medium,
                  color: theme.colors.muted,
                  paddingLeft: 14,
                  paddingVertical: 14,
                }}
              >
                @
              </Text>
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="ahmad"
                placeholderTextColor={theme.colors.dim}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                editable={!isSubmitting}
                style={{
                  flex: 1,
                  padding: 14,
                  fontSize: 15,
                  fontFamily: theme.fonts.arabicBody.regular,
                  color: theme.colors.text,
                  textAlign: 'left',
                  borderWidth: 0,
                }}
              />
            </View>
            {statusHint && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontFamily: theme.fonts.arabicBody.regular,
                  color: statusHint.color,
                  textAlign: 'right',
                }}
              >
                {statusHint.text}
              </Text>
            )}

            {/* Field 3: City */}
            <Text style={[styles.label, { marginTop: 20 }]}>مدينتك</Text>
            <Pressable
              onPress={() => setCityModalVisible(true)}
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <Text style={{ fontSize: 15, color: theme.colors.muted }}>▾</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: theme.fonts.arabicBody.regular,
                  color: city ? theme.colors.text : theme.colors.dim,
                }}
              >
                {city || 'اختر مدينتك'}
              </Text>
            </Pressable>

            {/* Field 4: English name (optional) */}
            <Text style={[styles.label, { marginTop: 20 }]}>
              اسمك بالإنجليزية (اختياري)
            </Text>
            <TextInput
              value={displayNameEn}
              onChangeText={setDisplayNameEn}
              placeholder="Abdulrahman saleh"
              placeholderTextColor={theme.colors.dim}
              autoCapitalize="words"
              maxLength={50}
              editable={!isSubmitting}
              style={[styles.input, { textAlign: 'left' }]}
            />

            {/* Error banner */}
            {formError && (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: 'rgba(179, 58, 58, 0.1)',
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.error,
                    fontSize: 12,
                    fontFamily: theme.fonts.arabicBody.regular,
                    textAlign: 'center',
                  }}
                >
                  {formError}
                </Text>
              </View>
            )}

            {/* CTA */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitDisabled}
              style={{ marginTop: 40 }}
            >
              <LinearGradient
                colors={[theme.colors.orange, theme.colors.brown]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  opacity: submitDisabled ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.bg,
                    fontSize: 15,
                    fontFamily: theme.fonts.arabicBody.bold,
                    textAlign: 'center',
                  }}
                >
                  {isSubmitting ? 'جارٍ الإنشاء...' : 'أنشئ حسابي'}
                </Text>
              </LinearGradient>
            </Pressable>
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
                  fontFamily: theme.fonts.arabicDisplay.medium,
                  color: theme.colors.text,
                }}
              >
                اختر مدينتك
              </Text>
            </View>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setCity(c);
                  setCityModalVisible(false);
                }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.borderSoft,
                  backgroundColor: city === c ? theme.colors.surface2 : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: theme.fonts.arabicBody.medium,
                    color: city === c ? theme.colors.brown : theme.colors.text,
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
    </SafeAreaView>
  );
}

const styles = {
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
} as const;
