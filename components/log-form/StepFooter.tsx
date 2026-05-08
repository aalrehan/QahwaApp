import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import {
  getNextStep,
  getPrevStep,
  isStepValid,
  useLogForm,
} from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const FINAL_STEP = 6;

type Props = {
  onSubmit?: () => void;
  submitting?: boolean;
  isEditing?: boolean;
};

export function StepFooter({ onSubmit, submitting = false, isEditing = false }: Props) {
  const { currentStep, formData, setStep } = useLogForm();
  const valid = isStepValid(currentStep, formData);
  const isFinalStep = currentStep === FINAL_STEP;
  const showBack = currentStep > 1 && !submitting;

  function handleNext() {
    if (submitting) return;
    if (!valid) return;
    if (isFinalStep) {
      onSubmit?.();
      return;
    }
    setStep(getNextStep(currentStep, formData));
  }

  function handleBack() {
    if (submitting) return;
    if (currentStep > 1) setStep(getPrevStep(currentStep, formData));
  }

  const buttonDisabled = !valid || submitting;
  const ctaLabel = submitting
    ? isEditing
      ? 'جارٍ التحديث...'
      : 'جارٍ الحفظ...'
    : isFinalStep
      ? isEditing
        ? 'تحديث'
        : 'حفظ'
      : 'التالي';

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSoft,
        backgroundColor: theme.colors.bg,
      }}
    >
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={{
            flex: 0.35,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 14,
              fontFamily: theme.fonts.arabicBody.medium,
            }}
          >
            السابق
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleNext}
        disabled={buttonDisabled}
        style={{ flex: showBack ? 0.65 : 1 }}
      >
        <LinearGradient
          colors={[theme.colors.orange, theme.colors.brown]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            opacity: buttonDisabled ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: theme.colors.bg,
              fontSize: 15,
              fontFamily: theme.fonts.arabicBody.bold,
            }}
          >
            {ctaLabel}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
