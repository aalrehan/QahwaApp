import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Step1Setup } from '@/components/log-form/Step1Setup';
import { Step2Cup } from '@/components/log-form/Step2Cup';
import { Step3Aroma } from '@/components/log-form/Step3Aroma';
import { Step4Visual } from '@/components/log-form/Step4Visual';
import { Step5Flavors } from '@/components/log-form/Step5Flavors';
import { Step6Final } from '@/components/log-form/Step6Final';
import { StepFooter } from '@/components/log-form/StepFooter';
import { StepHeader } from '@/components/log-form/StepHeader';
import { useSession } from '@/lib/auth';
import { LogFormProvider, useLogForm } from '@/lib/log-form-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Phase = 'form' | 'submitting' | 'success';

function StepRenderer() {
  const { currentStep } = useLogForm();
  switch (currentStep) {
    case 1:
      return <Step1Setup />;
    case 2:
      return <Step2Cup />;
    case 3:
      return <Step3Aroma />;
    case 4:
      return <Step4Visual />;
    case 5:
      return <Step5Flavors />;
    case 6:
      return <Step6Final />;
    default:
      return null;
  }
}

function AnimatedStepContainer() {
  const { fadeAnim, slideAnim } = useLogForm();
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <StepRenderer />
    </Animated.View>
  );
}

function mapSubmitError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('foreign key')) return 'خطأ في البيانات، حاول مجدداً';
  if (m.includes('rls') || m.includes('policy') || m.includes('permission')) {
    return 'خطأ في الصلاحيات';
  }
  if (m.includes('network') || m.includes('fetch')) return 'تحقق من اتصالك بالإنترنت';
  return message;
}

function FormHost() {
  const { user } = useSession();
  const { formData, reset } = useLogForm();
  const [phase, setPhase] = useState<Phase>('form');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'success') return;
    const t = setTimeout(() => {
      reset();
      setPhase('form');
      router.dismiss();
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, reset]);

  async function handleSubmit() {
    if (!user) {
      setSubmitError('يجب تسجيل الدخول أولاً');
      return;
    }
    setSubmitError(null);
    setPhase('submitting');

    const trimmedCup = (formData.cupDescription ?? '').trim();
    const trimmedNotes = (formData.notes ?? '').trim();
    const finalNotes = trimmedCup
      ? trimmedNotes
        ? `${trimmedCup}\n\n${trimmedNotes}`
        : trimmedCup
      : trimmedNotes || null;

    const payload = {
      user_id: user.id,
      cafe_id: formData.cafe?.id ?? null,
      drink_name: formData.drinkName.trim(),
      brew_method: formData.brewMethod,
      origin: formData.origin || null,
      photo_url: null,
      aroma_notes: (formData.aromaNotes ?? '').trim() || null,
      aroma_intensity: formData.aromaIntensity ?? null,
      crema_rating: formData.cremaRating ?? null,
      crema_color: formData.cremaColor ?? null,
      body: formData.body ?? null,
      mouthfeel: formData.mouthfeel ?? null,
      overall_rating: formData.overallRating ?? null,
      notes: finalNotes,
      is_public: formData.isPublic,
    };

    try {
      const { data: log, error: logError } = await supabase
        .from('coffee_logs')
        .insert(payload)
        .select('id')
        .single();
      if (logError) throw logError;

      if (formData.flavorNoteIds.length > 0 && log?.id) {
        const links = formData.flavorNoteIds.map((noteId) => ({
          log_id: log.id,
          note_id: noteId,
        }));
        const { error: linkError } = await supabase
          .from('log_flavor_notes')
          .insert(links);
        if (linkError) {
          // Non-fatal: log was saved.
          console.warn('flavor link insert failed:', linkError.message);
        }
      }

      setPhase('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(mapSubmitError(message));
      setPhase('form');
    }
  }

  if (phase === 'success') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        edges={['top', 'bottom']}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={120}
            color={theme.colors.success}
          />
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 36,
              fontFamily: theme.fonts.arabicDecorative.bold,
              marginTop: 24,
              textAlign: 'center',
              includeFontPadding: false,
            }}
          >
            تم الحفظ
          </Text>
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 14,
              fontFamily: theme.fonts.arabicBody.regular,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            ظهرت قهوتك في المفكرة
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <StepHeader />
        <View style={{ flex: 1 }}>
          <AnimatedStepContainer />
        </View>
        {submitError && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 8,
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
              {submitError}
            </Text>
          </View>
        )}
        <StepFooter onSubmit={handleSubmit} submitting={phase === 'submitting'} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function NewLogScreen() {
  return (
    <LogFormProvider>
      <FormHost />
    </LogFormProvider>
  );
}
