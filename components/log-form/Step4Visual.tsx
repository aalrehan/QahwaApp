import { ScrollView, Text } from 'react-native';

import { ColorChips } from '@/components/ui/ColorChips';
import { StarRating } from '@/components/ui/StarRating';
import { CREMA_COLORS } from '@/lib/constants';
import { useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const RATING_LABELS: Record<number, string> = {
  0: 'اضغط لتقييم',
  1: 'سيئه',
  2: 'مقبولة',
  3: 'جيدة',
  4: 'ممتازة',
  5: 'استثنائية',
};

export function Step4Visual() {
  const { formData, updateData } = useLogForm();
  const cremaRating = formData.cremaRating ?? 0;
  const cremaColor = formData.cremaColor ?? null;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 24,
          fontFamily: theme.fonts.arabicDisplay.bold,
          textAlign: 'center',
        }}
      >
        المظهر
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          textAlign: 'center',
          marginTop: 6,
        }}
      >
        كيف كانت الكريما؟
      </Text>

      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 12,
          fontFamily: theme.fonts.arabicBody.medium,
          marginTop: 32,
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        تقييم الكريما
      </Text>

      <StarRating
        value={cremaRating}
        onChange={(n) => updateData({ cremaRating: n })}
      />

      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 13,
          color: cremaRating > 0 ? theme.colors.brown : theme.colors.muted,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        {RATING_LABELS[cremaRating] ?? RATING_LABELS[0]}
      </Text>

      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 12,
          fontFamily: theme.fonts.arabicBody.medium,
          marginTop: 32,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        لون الكريما
      </Text>

      <ColorChips
        options={CREMA_COLORS}
        value={cremaColor}
        onChange={(id) => updateData({ cremaColor: id })}
      />
    </ScrollView>
  );
}
