import { Pressable, Text, View } from 'react-native';

import { getDisplayStep, useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

type Props = {
  isEditing?: boolean;
  onClose: () => void;
};

export function StepHeader({ isEditing = false, onClose }: Props) {
  const { currentStep, formData } = useLogForm();
  const { displayStep, totalSteps } = getDisplayStep(currentStep, formData.brewMethod);

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
        <Pressable hitSlop={12} onPress={onClose}>
          <Text style={{ fontSize: 28, color: theme.colors.muted, lineHeight: 30 }}>×</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {isEditing ? (
          <Text
            style={{
              color: theme.colors.brown,
              fontSize: 11,
              letterSpacing: 1.5,
              fontFamily: theme.fonts.arabicBody.bold,
              marginBottom: 4,
            }}
          >
            تعديل
          </Text>
        ) : null}
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
