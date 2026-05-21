import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
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
import { hasFormData, LogFormProvider, useLogForm } from '@/lib/log-form-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import type { CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

type Phase = 'form' | 'submitting' | 'success';

const SELECT_QUERY = `
  *,
  cafe:cafes(id, name_ar, city),
  profile:profiles!user_id(username, display_name_ar, city),
  log_flavor_notes(
    flavor_note:flavor_notes(id, name_ar, color_hex, emoji, level)
  ),
  likes_count:likes(count)
`;

function flattenLog(raw: RawCoffeeLogRow): CoffeeLog {
  const { log_flavor_notes, likes_count, ...rest } = raw;
  const flavor_notes = (log_flavor_notes ?? [])
    .map((entry) => entry.flavor_note)
    .filter((n): n is NonNullable<typeof n> => !!n);
  const count = Array.isArray(likes_count) ? likes_count[0]?.count ?? 0 : 0;
  return { ...rest, flavor_notes, likes_count: count };
}

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
  if (m.includes('not found') || m.includes('no rows')) return 'لم يتم العثور على التسجيل';
  return message;
}

function FormHost({ editId }: { editId?: string }) {
  const isEditing = !!editId;
  const { user } = useSession();
  const { formData, populate, reset } = useLogForm();
  const [phase, setPhase] = useState<Phase>('form');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(isEditing);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const populatedRef = useRef(false);

  // Fetch + populate when in edit mode.
  useEffect(() => {
    if (!isEditing || !editId || populatedRef.current) return;
    let cancelled = false;
    (async () => {
      setEditLoading(true);
      setEditLoadError(null);
      const { data, error } = await supabase
        .from('coffee_logs')
        .select(SELECT_QUERY)
        .eq('id', editId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setEditLoadError(error.message);
        setEditLoading(false);
        return;
      }
      if (!data) {
        setEditLoadError('لم يتم العثور على التسجيل');
        setEditLoading(false);
        return;
      }
      const log = flattenLog(data as unknown as RawCoffeeLogRow);
      populate(log);
      populatedRef.current = true;
      setEditLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, editId, populate]);

  useEffect(() => {
    if (phase !== 'success') return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
    const t = setTimeout(() => {
      reset();
      setPhase('form');
      router.dismiss();
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, reset]);

  // Close handler shared by the header X and the Android hardware back button.
  // Skips the confirmation when nothing has been entered yet.
  const handleClose = useCallback(() => {
    if (!hasFormData(formData)) {
      reset();
      router.dismiss();
      return;
    }
    Alert.alert('تجاهل التسجيل؟', 'لديك بيانات غير محفوظة، هل تريد الخروج؟', [
      {
        text: 'تجاهل',
        style: 'destructive',
        onPress: () => {
          reset();
          router.dismiss();
        },
      },
      { text: 'متابعة', style: 'cancel' },
    ]);
  }, [formData, reset]);

  // Android hardware back: same discard logic as the close button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'form') {
        handleClose();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [phase, handleClose]);

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
      // Crema fields are null for non-espresso brew methods (Step 4 is skipped).
      crema_rating: formData.cremaRating ?? null,
      crema_color: formData.cremaColor ?? null,
      body: formData.body ?? null,
      mouthfeel: formData.mouthfeel ?? null,
      overall_rating: formData.overallRating ?? null,
      notes: finalNotes,
      is_public: formData.isPublic,
    };

    try {
      if (isEditing && editId) {
        // UPDATE existing log; user_id eq is a defense-in-depth check on top of RLS.
        const { error: updateError } = await supabase
          .from('coffee_logs')
          .update(payload)
          .eq('id', editId)
          .eq('user_id', user.id);
        if (updateError) throw updateError;

        // Replace flavor links: delete all, then re-insert (simpler than diffing).
        const { error: deleteLinksError } = await supabase
          .from('log_flavor_notes')
          .delete()
          .eq('log_id', editId);
        if (deleteLinksError) {
          console.warn('flavor link delete failed:', deleteLinksError.message);
        }
        if (formData.flavorNoteIds.length > 0) {
          const links = formData.flavorNoteIds.map((noteId) => ({
            log_id: editId,
            note_id: noteId,
          }));
          const { error: linkError } = await supabase
            .from('log_flavor_notes')
            .insert(links);
          if (linkError) {
            console.warn('flavor link insert failed:', linkError.message);
          }
        }

        setPhase('success');
        return;
      }

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

  if (editLoading) {
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

  if (editLoadError) {
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
          <Text
            style={{
              color: theme.colors.error,
              fontSize: 14,
              fontFamily: theme.fonts.arabicBody.regular,
              textAlign: 'center',
            }}
          >
            {editLoadError}
          </Text>
          <Pressable onPress={() => router.dismiss()} style={{ marginTop: 16, padding: 8 }}>
            <Text
              style={{
                color: theme.colors.orange,
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 13,
              }}
            >
              رجوع
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
            {isEditing ? 'تم التحديث' : 'تم الحفظ'}
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
            {isEditing ? 'تم تحديث قهوتك' : 'ظهرت قهوتك في المفكرة'}
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
        <StepHeader isEditing={isEditing} onClose={handleClose} />
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
        <StepFooter
          onSubmit={handleSubmit}
          submitting={phase === 'submitting'}
          isEditing={isEditing}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function NewLogScreen() {
  const params = useLocalSearchParams<{ editId?: string }>();
  return (
    <LogFormProvider>
      <FormHost editId={params.editId} />
    </LogFormProvider>
  );
}
