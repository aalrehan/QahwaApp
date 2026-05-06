import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { isStepValid, useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const TOTAL_STEPS = 6;

export function StepFooter() {
  const { currentStep, formData, setStep, reset } = useLogForm();
  const valid = isStepValid(currentStep, formData);
  const isFinalStep = currentStep === TOTAL_STEPS;
  const showBack = currentStep > 1;

  function handleNext() {
    if (!valid) return;
    if (isFinalStep) {
      // V1: saving not implemented yet — close modal.
      reset();
      router.dismiss();
      return;
    }
    setStep(currentStep + 1);
  }

  function handleBack() {
    if (currentStep > 1) setStep(currentStep - 1);
  }

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
        disabled={!valid}
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
            opacity: valid ? 1 : 0.5,
          }}
        >
          <Text
            style={{
              color: theme.colors.bg,
              fontSize: 15,
              fontFamily: theme.fonts.arabicBody.bold,
            }}
          >
            {isFinalStep ? 'حفظ' : 'التالي'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
