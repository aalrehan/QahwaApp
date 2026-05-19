import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StarRating } from '@/components/ui/StarRating';
import { useLogForm } from '@/lib/log-form-context';
import { theme } from '@/lib/theme';

const FIELD_MAX_WIDTH = 360;
const NOTES_MAX = 280;

const BODY_OPTIONS = ['خفيف', 'متوسط', 'ممتلئ', 'كريمي'];

const MOUTHFEEL_OPTIONS = [
  'ناعم',
  'حريري',
  'جاف',
  'دائم',
  'لاذع',
  'زيتي',
  'حاد',
];

const RATING_LABELS: Record<number, string> = {
  0: 'اضغط لتقييم',
  1: 'لم تعجبني',
  2: 'مقبولة',
  3: 'جيدة',
  4: 'رائعة',
  5: 'استثنائية',
};

export function Step6Final() {
  const { formData, updateData } = useLogForm();
  const body = formData.body ?? '';
  const mouthfeel = formData.mouthfeel ?? '';
  const overallRating = formData.overallRating ?? 0;
  const notes = formData.notes ?? '';
  const isPublic = formData.isPublic ?? true;

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
        الخطوة الأخيرة
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
        لمسات نهائية
      </Text>

      <View
        style={{
          width: '100%',
          maxWidth: FIELD_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        {/* Body */}
        <Text style={[styles.label, { marginTop: 32, textAlign: 'right' }]}>
          القوام
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {BODY_OPTIONS.map((opt) => {
            const selected = body === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => updateData({ body: selected ? '' : opt })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Mouthfeel */}
        <Text style={[styles.label, { marginTop: 24, textAlign: 'right' }]}>
          الشعور على اللسان
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {MOUTHFEEL_OPTIONS.map((opt) => {
            const selected = mouthfeel === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => updateData({ mouthfeel: selected ? '' : opt })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Overall rating */}
        <Text style={[styles.label, { marginTop: 32, marginBottom: 16, textAlign: 'center' }]}>
          التقييم العام
        </Text>
        <StarRating
          value={overallRating}
          onChange={(n) => updateData({ overallRating: n })}
          size={44}
          color={theme.colors.orange}
        />
        <Text
          style={{
            fontFamily: theme.fonts.arabicBody.medium,
            fontSize: 14,
            color: overallRating > 0 ? theme.colors.brown : theme.colors.muted,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          {RATING_LABELS[overallRating] ?? RATING_LABELS[0]}
        </Text>

        {/* Notes */}
        <Text style={[styles.label, { marginTop: 32, textAlign: 'right' }]}>
          ملاحظات إضافية (اختياري)
        </Text>
        <TextInput
          value={notes}
          onChangeText={(t) => updateData({ notes: t.slice(0, NOTES_MAX) })}
          placeholder="أفكارك النهائية حول هذه القهوة..."
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
          {`${notes.length} / ${NOTES_MAX}`}
        </Text>

        {/* Public toggle */}
        <View
          style={{
            marginTop: 32,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderSoft,
            borderRadius: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.brown,
                fontSize: 14,
                fontFamily: theme.fonts.arabicBody.medium,
                textAlign: 'right',
              }}
            >
              نشر للجميع
            </Text>
            <Text
              style={{
                color: theme.colors.muted,
                fontSize: 11,
                fontFamily: theme.fonts.arabicBody.regular,
                marginTop: 2,
                textAlign: 'right',
              }}
            >
              ستظهر هذه القهوة في المفكرة العامة
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(v) => updateData({ isPublic: v })}
            trackColor={{
              false: theme.colors.borderSoft,
              true: theme.colors.orange,
            }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.arabicBody.medium,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: theme.colors.orange,
    borderColor: theme.colors.orange,
  },
  chipText: {
    fontSize: 13,
    fontFamily: theme.fonts.arabicBody.medium,
    color: theme.colors.textSoft,
  },
  chipTextSelected: {
    color: theme.colors.bg,
  },
} as const;
