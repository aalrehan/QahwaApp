import { ScrollView, Text, TextInput, View } from 'react-native';

import { IntensityDial } from '@/components/ui/IntensityDial';
import { useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const FIELD_MAX_WIDTH = 360;
const NOTES_MAX = 200;

export function Step3Aroma() {
  const { formData, updateData } = useLogForm();
  const aromaNotes = formData.aromaNotes ?? '';
  const aromaIntensity = formData.aromaIntensity ?? 0;

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
        الرائحة
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
        اوصف عبق القهوه
      </Text>

      <View
        style={{
          width: '100%',
          maxWidth: FIELD_MAX_WIDTH,
          alignSelf: 'center',
          marginTop: 32,
        }}
      >
        <Text
          style={{
            color: theme.colors.muted,
            fontSize: 12,
            fontFamily: theme.fonts.arabicBody.medium,
            marginBottom: 8,
            textAlign: 'right',
          }}
        >
          ملاحظات الرائحة
        </Text>
        <TextInput
          value={aromaNotes}
          onChangeText={(t) => updateData({ aromaNotes: t.slice(0, NOTES_MAX) })}
          placeholder="حموضة فاكهية، رائحة شوكولاتة، ياسمين..."
          placeholderTextColor={theme.colors.dim}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={NOTES_MAX}
          blurOnSubmit={false}
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
            minHeight: 88,
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
          {`${aromaNotes.length} / ${NOTES_MAX}`}
        </Text>
      </View>

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
        شدة الرائحة
      </Text>

      <IntensityDial
        value={aromaIntensity}
        onChange={(n) => updateData({ aromaIntensity: n })}
      />
    </ScrollView>
  );
}
