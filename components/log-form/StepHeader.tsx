import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { getDisplayStep, useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

export function StepHeader() {
  const { currentStep, formData, reset } = useLogForm();
  const { displayStep, totalSteps } = getDisplayStep(currentStep, formData.brewMethod);

  function handleClose() {
    Alert.alert(
      'هل تريد إلغاء التسجيل؟',
      '',
      [
        { text: 'متابعة التسجيل', style: 'cancel' },
        {
          text: 'إلغاء',
          style: 'destructive',
          onPress: () => {
            reset();
            router.dismiss();
          },
        },
      ],
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
      }}
    >
      <View style={{ width: 32, alignItems: 'flex-start' }}>
        <Pressable hitSlop={12} onPress={handleClose}>
          <Text style={{ fontSize: 28, color: theme.colors.muted, lineHeight: 30 }}>×</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 13,
            fontFamily: theme.fonts.arabicBody.medium,
          }}
        >
          {`الخطوة ${displayStep} من ${totalSteps}`}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            direction: 'ltr',
            gap: 4,
            marginTop: 8,
            width: '70%',
          }}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor:
                  i < displayStep ? theme.colors.orange : theme.colors.borderSoft,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ width: 32 }} />
    </View>
  );
}
