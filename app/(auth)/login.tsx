import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Step = 'email' | 'otp' | 'success';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;
const FIELD_MAX_WIDTH = 360;
const OTP_LENGTH = 6;

const emptyOtp = (): string[] => Array(OTP_LENGTH).fill('');

function mapEmailError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid') && m.includes('email')) return 'البريد الإلكتروني غير صحيح';
  if (m.includes('rate') || m.includes('too many') || m.includes('limit')) {
    return 'حاول مرة أخرى بعد قليل';
  }
  if (m.includes('network') || m.includes('fetch')) return 'تحقق من اتصالك بالإنترنت';
  return message;
}

function mapOtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('expired')) return 'انتهت صلاحية الرمز';
  if (m.includes('rate') || m.includes('too many')) return 'محاولات كثيرة، حاول لاحقاً';
  if (m.includes('invalid') || m.includes('token')) return 'الرمز غير صحيح';
  if (m.includes('network') || m.includes('fetch')) return 'تحقق من اتصالك بالإنترنت';
  return message;
}

function truncateEmail(email: string): string {
  if (email.length <= 28) return email;
  return email.slice(0, 25) + '...';
}

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [otp, setOtp] = useState<string[]>(emptyOtp);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [resendToast, setResendToast] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (step !== 'otp') return;
    if (resendSeconds <= 0) return;
    const id = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step, resendSeconds]);

  useEffect(() => {
    if (!resendToast) return;
    const id = setTimeout(() => setResendToast(false), 2000);
    return () => clearTimeout(id);
  }, [resendToast]);

  const emailIsValid = EMAIL_REGEX.test(email.trim());
  const sendDisabled = !emailIsValid || emailLoading;

  async function handleSendOtp() {
    if (sendDisabled) return;
    setEmailError(null);
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        setEmailError(mapEmailError(error.message));
        return;
      }
      setOtp(emptyOtp());
      setActiveIndex(0);
      setResendSeconds(RESEND_SECONDS);
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setEmailError(mapEmailError(message));
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleVerifyOtp(token: string) {
    setOtpError(null);
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email',
      });
      if (error) {
        setOtpError(mapOtpError(error.message));
        return;
      }
      setStep('success');
      setTimeout(() => router.replace('/(app)'), 600);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setOtpError(mapOtpError(message));
    } finally {
      setOtpLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length > 1) {
      const distributed = digitsOnly
        .slice(0, OTP_LENGTH)
        .padEnd(OTP_LENGTH, ' ')
        .split('');
      const next = distributed.map((c) => (c === ' ' ? '' : c));
      setOtp(next);
      const filledCount = next.filter((c) => c !== '').length;
      const focusIdx = Math.min(filledCount, OTP_LENGTH - 1);
      setActiveIndex(focusIdx);
      otpRefs.current[focusIdx]?.focus();
      if (filledCount === OTP_LENGTH) {
        handleVerifyOtp(next.join(''));
      }
      return;
    }

    const next = [...otp];
    next[index] = digitsOnly;
    setOtp(next);
    setOtpError(null);

    if (digitsOnly && index < OTP_LENGTH - 1) {
      const nextIdx = index + 1;
      setActiveIndex(nextIdx);
      otpRefs.current[nextIdx]?.focus();
    }

    if (next.every((c) => c !== '') && next.join('').length === OTP_LENGTH) {
      handleVerifyOtp(next.join(''));
    }
  }

  function handleOtpKeyPress(
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevIdx = index - 1;
      const next = [...otp];
      next[prevIdx] = '';
      setOtp(next);
      setActiveIndex(prevIdx);
      otpRefs.current[prevIdx]?.focus();
    }
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    setOtpError(null);
    setOtp(emptyOtp());
    setActiveIndex(0);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        setOtpError(mapOtpError(error.message));
        return;
      }
      setResendSeconds(RESEND_SECONDS);
      setResendToast(true);
      otpRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setOtpError(mapOtpError(message));
    }
  }

  function handleChangeEmail() {
    setStep('email');
    setOtpError(null);
    setOtp(emptyOtp());
    setActiveIndex(0);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 80,
            }}
          >
            <Text
              style={{
                color: theme.colors.brown,
                fontSize: 52,
                fontFamily: theme.fonts.arabicDecorative.bold,
              }}
            >
              قهوة
            </Text>
            <View
              style={{
                width: 1,
                height: 20,
                backgroundColor: theme.colors.border,
                marginHorizontal: 14,
                opacity: 0.7,
                alignSelf: 'center',
              }}
            />
            <Text
              style={{
                color: theme.colors.brown,
                fontSize: 22,
                fontFamily: theme.fonts.englishDisplay.italic,
                letterSpacing: 3,
              }}
            >
              QAHWA
            </Text>
          </View>

          <View style={{ alignItems: 'center', width: '100%', marginTop: 60 }}>
            {step === 'email' && (
              <EmailStep
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                emailLoading={emailLoading}
                sendDisabled={sendDisabled}
                onSubmit={handleSendOtp}
              />
            )}

            {step === 'otp' && (
              <OtpStep
                email={email}
                otp={otp}
                otpRefs={otpRefs}
                activeIndex={activeIndex}
                otpError={otpError}
                otpLoading={otpLoading}
                resendSeconds={resendSeconds}
                resendToast={resendToast}
                onChange={handleOtpChange}
                onKeyPress={handleOtpKeyPress}
                onFocus={(i) => setActiveIndex(i)}
                onResend={handleResend}
                onChangeEmail={handleChangeEmail}
              />
            )}

            {step === 'success' && <SuccessStep />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmailStep({
  email,
  setEmail,
  emailError,
  emailLoading,
  sendDisabled,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  emailError: string | null;
  emailLoading: boolean;
  sendDisabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 22,
          fontFamily: theme.fonts.arabicDisplay.bold,
          textAlign: 'center',
          width: '100%',
        }}
      >
        سجّل دخولك
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          marginTop: 6,
          textAlign: 'center',
          width: '100%',
        }}
      >
        سنرسل لك رمزاً مكوناً من 6 أرقام
      </Text>

      <View
        style={{
          marginTop: 32,
          width: '100%',
          maxWidth: FIELD_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 12,
            fontFamily: theme.fonts.arabicBody.medium,
            marginBottom: 8,
            textAlign: 'center',
            width: '100%',
          }}
        >
          البريد الإلكتروني
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="name@example.com"
          placeholderTextColor={theme.colors.dim}
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            fontFamily: theme.fonts.arabicBody.regular,
            color: theme.colors.text,
            textAlign: 'center',
          }}
        />
      </View>

      {emailError && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: 'rgba(179, 58, 58, 0.1)',
            padding: 10,
            borderRadius: 8,
            width: '100%',
            maxWidth: FIELD_MAX_WIDTH,
            alignSelf: 'center',
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
            {emailError}
          </Text>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={sendDisabled}
        style={{
          marginTop: 24,
          width: '100%',
          maxWidth: FIELD_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <LinearGradient
          colors={[theme.colors.orange, theme.colors.brown]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 16,
            borderRadius: 12,
            opacity: sendDisabled ? 0.5 : 1,
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
            {emailLoading ? 'جارٍ الإرسال...' : 'أرسل الرمز'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function OtpStep({
  email,
  otp,
  otpRefs,
  activeIndex,
  otpError,
  otpLoading,
  resendSeconds,
  resendToast,
  onChange,
  onKeyPress,
  onFocus,
  onResend,
  onChangeEmail,
}: {
  email: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(TextInput | null)[]>;
  activeIndex: number;
  otpError: string | null;
  otpLoading: boolean;
  resendSeconds: number;
  resendToast: boolean;
  onChange: (i: number, v: string) => void;
  onKeyPress: (i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  onFocus: (i: number) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const seconds = String(resendSeconds).padStart(2, '0');

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 22,
          fontFamily: theme.fonts.arabicDisplay.bold,
          textAlign: 'center',
          width: '100%',
        }}
      >
        تحقق من بريدك
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          marginTop: 6,
          textAlign: 'center',
          width: '100%',
        }}
      >
        أرسلنا الرمز إلى
      </Text>
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.medium,
          marginTop: 2,
          textAlign: 'center',
          width: '100%',
        }}
      >
        {truncateEmail(email)}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          direction: 'ltr',
          justifyContent: 'center',
          gap: 8,
          marginTop: 40,
        }}
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => i).map((i) => {
          const filled = otp[i] !== '';
          const isActive = activeIndex === i;
          return (
            <TextInput
              key={i}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              value={otp[i]}
              onChangeText={(v) => onChange(i, v)}
              onKeyPress={(e) => onKeyPress(i, e)}
              onFocus={() => onFocus(i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!otpLoading}
              style={{
                width: 46,
                height: 60,
                backgroundColor: filled ? theme.colors.surface2 : theme.colors.surface,
                borderWidth: 2,
                borderColor: filled
                  ? theme.colors.border
                  : isActive
                    ? theme.colors.orange
                    : theme.colors.borderSoft,
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: theme.fonts.arabicDisplay.semibold,
                color: theme.colors.brown,
              }}
            />
          );
        })}
      </View>

      {otpError && (
        <View
          style={{
            marginTop: 16,
            backgroundColor: 'rgba(179, 58, 58, 0.1)',
            padding: 10,
            borderRadius: 8,
            width: '100%',
            maxWidth: FIELD_MAX_WIDTH,
            alignSelf: 'center',
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
            {otpError}
          </Text>
        </View>
      )}

      {resendToast && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: 'rgba(45, 122, 62, 0.12)',
            padding: 10,
            borderRadius: 8,
            width: '100%',
            maxWidth: FIELD_MAX_WIDTH,
            alignSelf: 'center',
          }}
        >
          <Text
            style={{
              color: theme.colors.success,
              fontSize: 12,
              fontFamily: theme.fonts.arabicBody.medium,
              textAlign: 'center',
            }}
          >
            تم إرسال رمز جديد
          </Text>
        </View>
      )}

      <View style={{ alignItems: 'center', width: '100%', marginTop: 28 }}>
        {resendSeconds > 0 ? (
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 13,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
              width: '100%',
            }}
          >
            إعادة الإرسال خلال 0:{seconds}
          </Text>
        ) : (
          <Pressable onPress={onResend}>
            <Text
              style={{
                color: theme.colors.orange,
                fontSize: 13,
                fontFamily: theme.fonts.arabicBody.medium,
                textAlign: 'center',
              }}
            >
              لم يصلك الرمز؟ أعد الإرسال
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ alignItems: 'center', width: '100%', marginTop: 16 }}>
        <Pressable onPress={onChangeEmail}>
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 12,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
            }}
          >
            تغيير البريد الإلكتروني
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SuccessStep() {
  return (
    <View style={{ alignItems: 'center', width: '100%', marginTop: 80 }}>
      <Text
        style={{
          fontSize: 80,
          color: theme.colors.success,
          textAlign: 'center',
          width: '100%',
        }}
      >
        ✓
      </Text>
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 32,
          fontFamily: theme.fonts.arabicDecorative.bold,
          marginTop: 16,
          textAlign: 'center',
          width: '100%',
        }}
      >
        تم!
      </Text>
    </View>
  );
}
