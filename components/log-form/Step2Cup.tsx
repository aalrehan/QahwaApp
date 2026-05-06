import { ScrollView, Text, TextInput, View } from 'react-native';

import { useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const MAX_LENGTH = 280;
const FIELD_MAX_WIDTH = 360;

export function Step2Cup() {
  const { formData, updateData } = useLogForm();
  const value = formData.cupDescription;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 22,
          fontFamily: theme.fonts.arabicDisplay.bold,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        وصف الكوب
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          fontFamily: theme.fonts.arabicBody.regular,
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        كيف كانت قهوتك؟
      </Text>

      <View
        style={{
          width: '100%',
          maxWidth: FIELD_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={(t) => updateData({ cupDescription: t.slice(0, MAX_LENGTH) })}
          placeholder="كوب صغير من السيراميك، رغوة كثيفة..."
          placeholderTextColor={theme.colors.dim}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={MAX_LENGTH}
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            fontFamily: theme.fonts.arabicBody.regular,
            color: theme.colors.text,
            textAlign: 'right',
            height: 120,
          }}
        />
        <Text
          style={{
            marginTop: 6,
            fontSize: 11,
            fontFamily: theme.fonts.arabicBody.regular,
            color: theme.colors.dim,
            textAlign: 'left',
          }}
        >
          {`${value.length} / ${MAX_LENGTH}`}
        </Text>
      </View>
    </ScrollView>
  );
}
