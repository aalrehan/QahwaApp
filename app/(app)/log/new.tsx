import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Step1Setup } from '@/components/log-form/Step1Setup';
import { Step2Cup } from '@/components/log-form/Step2Cup';
import { Step3Aroma } from '@/components/log-form/Step3Aroma';
import { Step4Visual } from '@/components/log-form/Step4Visual';
import { Step5Flavors } from '@/components/log-form/Step5Flavors';
import { Step6Final } from '@/components/log-form/Step6Final';
import { StepFooter } from '@/components/log-form/StepFooter';
import { StepHeader } from '@/components/log-form/StepHeader';
import { LogFormProvider, useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

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

export default function NewLogScreen() {
  return (
    <LogFormProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <StepHeader />
          <View style={{ flex: 1 }}>
            <StepRenderer />
          </View>
          <StepFooter />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LogFormProvider>
  );
}
