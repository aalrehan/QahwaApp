import { Feather, Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  CREMA_COLORS_BY_ID,
  INTENSITY_LABELS,
  OVERALL_RATING_LABELS,
} from '@/lib/constants';
import { theme } from '@/lib/theme';
import type { CoffeeLog, FlavorNoteSummary } from '@/lib/types';

type Props = {
  log: CoffeeLog;
  variant: 'feed' | 'diary';
};

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

// Editorial-card intensity progression — slightly different from the
// IntensityDial palette to read as a smoother gradient at small size.
const INTENSITY_COLORS: Record<number, string> = {
  1: '#E8854A',
  2: '#DC7126',
  3: '#D2691E',
  4: '#9F4F1A',
  5: '#6B3A1F',
};

function formatArabicRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 0) return 'الآن';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours === 1) return 'منذ ساعة';
  if (hours === 2) return 'منذ ساعتين';
  if (hours < 24) return `منذ ${hours} ساعات`;
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  if (weeks === 1) return 'قبل أسبوع';
  if (weeks < 4) return `قبل ${weeks} أسابيع`;

  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]}`;
}

function comingSoon() {
  Alert.alert('قريباً', 'هذه الميزة ستكون متاحة قريباً');
}

function SectionDivider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.borderSoft,
        marginHorizontal: 24,
        opacity: 0.6,
      }}
    />
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: theme.fonts.arabicBody.medium,
        fontSize: 11,
        color: theme.colors.muted,
        textAlign: 'center',
        letterSpacing: 1.5,
      }}
    >
      {children}
    </Text>
  );
}

function FlavorChip({ note }: { note: FlavorNoteSummary }) {
  const showEmoji = note.level === 1 && !!note.emoji;
  const dotColor = note.color_hex || theme.colors.muted;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      {showEmoji ? (
        <Text style={{ fontSize: 13 }}>{note.emoji}</Text>
      ) : (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
          }}
        />
      )}
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 12,
          color: theme.colors.brown,
        }}
      >
        {note.name_ar}
      </Text>
    </View>
  );
}

function CharacterPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.regular,
          fontSize: 11,
          color: theme.colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 13,
          color: theme.colors.brown,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function StarsRow({ count, size }: { count: number; size: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        direction: 'ltr',
        gap: size >= 24 ? 8 : 6,
        alignSelf: 'center',
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= count ? 'star' : 'star-outline'}
          size={size}
          color={i <= count ? theme.colors.orange : theme.colors.dim}
        />
      ))}
    </View>
  );
}

function IntensityBar({ value }: { value: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        direction: 'ltr',
        gap: 4,
        height: 6,
        width: 100,
      }}
    >
      {[1, 2, 3, 4, 5].map((level) => {
        const filled = level <= value;
        return (
          <View
            key={level}
            style={{
              width: 18,
              height: 6,
              borderRadius: 3,
              backgroundColor: filled
                ? INTENSITY_COLORS[level]
                : theme.colors.borderSoft,
            }}
          />
        );
      })}
    </View>
  );
}

export function CoffeeLogCard({ log, variant }: Props) {
  const cremaInfo = CREMA_COLORS_BY_ID[log.crema_color];
  const intensityLabel = INTENSITY_LABELS[log.aroma_intensity] ?? '';
  const ratingLabel = OVERALL_RATING_LABELS[log.overall_rating] ?? '';
  const truncatedNotes =
    log.notes && log.notes.length > 200
      ? log.notes.slice(0, 200) + '...'
      : log.notes;
  const hasNotes = !!truncatedNotes && truncatedNotes.trim().length > 0;
  const hasFlavors = log.flavor_notes.length > 0;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: theme.colors.brown,
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      {/* SECTION 1: HEADER */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 22,
          paddingBottom: 18,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.arabicDisplay.semibold,
            fontSize: 17,
            color: theme.colors.brown,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {log.cafe?.name_ar || 'في المنزل'}
        </Text>
        {log.cafe?.city ? (
          <View
            style={{
              marginTop: 6,
              alignSelf: 'center',
              backgroundColor: theme.colors.surface2,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 11,
                color: theme.colors.muted,
                textAlign: 'center',
              }}
            >
              {log.cafe.city}
            </Text>
          </View>
        ) : null}
        <Text
          style={{
            marginTop: 12,
            fontFamily: theme.fonts.arabicBody.regular,
            fontSize: 11,
            color: theme.colors.dim,
            textAlign: 'center',
          }}
        >
          {formatArabicRelative(log.created_at)}
        </Text>
        {variant === 'feed' && log.profile?.username ? (
          <Text
            style={{
              marginTop: 4,
              fontFamily: theme.fonts.arabicBody.medium,
              fontSize: 11,
              color: theme.colors.muted,
              textAlign: 'center',
            }}
          >
            @{log.profile.username}
          </Text>
        ) : null}
      </View>

      {/* SECTION 2: DRINK HERO */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.arabicDisplay.bold,
            fontSize: 26,
            color: theme.colors.brownDeep,
            textAlign: 'center',
            letterSpacing: -0.3,
            lineHeight: 32,
            includeFontPadding: false,
          }}
        >
          {log.drink_name}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontFamily: theme.fonts.arabicBody.medium,
            fontSize: 13,
            color: theme.colors.muted,
            textAlign: 'center',
            letterSpacing: 0.3,
          }}
        >
          {log.brew_method}
          {log.origin ? ` · ${log.origin}` : ''}
        </Text>
      </View>

      <SectionDivider />

      {/* SECTION 3: AROMA */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 22,
          alignItems: 'center',
        }}
      >
        <SectionLabel>الرائحة</SectionLabel>
        <Text
          style={{
            marginTop: 10,
            fontFamily: theme.fonts.arabicBody.regular,
            fontSize: 15,
            color: theme.colors.text,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 8,
          }}
        >
          {log.aroma_notes}
        </Text>
        <View
          style={{
            marginTop: 16,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
            alignSelf: 'center',
          }}
        >
          <IntensityBar value={log.aroma_intensity} />
          <Text
            style={{
              fontFamily: theme.fonts.arabicBody.regular,
              fontSize: 14,
              color: theme.colors.dim,
            }}
          >
            —
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.arabicBody.medium,
              fontSize: 13,
              color: theme.colors.brown,
            }}
          >
            {intensityLabel}
          </Text>
        </View>
      </View>

      <SectionDivider />

      {/* SECTION 4: CREMA */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 22,
          alignItems: 'center',
        }}
      >
        <SectionLabel>الكريما</SectionLabel>
        <View style={{ marginTop: 12 }}>
          <StarsRow count={log.crema_rating} size={22} />
        </View>
        {cremaInfo ? (
          <View
            style={{
              marginTop: 12,
              alignItems: 'center',
              flexDirection: 'row',
              gap: 10,
              alignSelf: 'center',
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: cremaInfo.hex,
                borderWidth: 1,
                borderColor: theme.colors.borderSoft,
              }}
            />
            <Text
              style={{
                fontFamily: theme.fonts.arabicBody.medium,
                fontSize: 13,
                color: theme.colors.brown,
              }}
            >
              {cremaInfo.name_ar}
            </Text>
          </View>
        ) : null}
      </View>

      {/* SECTION 5: FLAVORS */}
      {hasFlavors ? (
        <>
          <SectionDivider />
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 22,
              alignItems: 'center',
            }}
          >
            <SectionLabel>النكهات</SectionLabel>
            <View
              style={{
                marginTop: 12,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
                alignSelf: 'center',
                width: '100%',
              }}
            >
              {log.flavor_notes.map((n) => (
                <FlavorChip key={n.id} note={n} />
              ))}
            </View>
          </View>
        </>
      ) : null}

      <SectionDivider />

      {/* SECTION 6: CHARACTER */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 22,
          alignItems: 'center',
        }}
      >
        <SectionLabel>الإحساس</SectionLabel>
        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            gap: 10,
            justifyContent: 'center',
            alignSelf: 'center',
            flexWrap: 'wrap',
          }}
        >
          {log.body ? <CharacterPill label="القوام:" value={log.body} /> : null}
          {log.mouthfeel ? (
            <CharacterPill label="الشعور:" value={log.mouthfeel} />
          ) : null}
        </View>
      </View>

      {/* SECTION 7: NOTES */}
      {hasNotes ? (
        <>
          <SectionDivider />
          <View
            style={{
              paddingHorizontal: 32,
              paddingVertical: 22,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.arabicDecorative.regular,
                fontSize: 24,
                color: theme.colors.dim,
                textAlign: 'center',
                lineHeight: 24,
                includeFontPadding: false,
              }}
            >
              ❝
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: theme.fonts.arabicBody.regular,
                fontSize: 14,
                color: theme.colors.textSoft,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {truncatedNotes}
            </Text>
          </View>
        </>
      ) : null}

      <SectionDivider />

      {/* SECTION 8: RATING */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          alignItems: 'center',
        }}
      >
        <SectionLabel>التقييم العام</SectionLabel>
        <View style={{ marginTop: 14 }}>
          <StarsRow count={log.overall_rating} size={28} />
        </View>
        <Text
          style={{
            marginTop: 12,
            fontFamily: theme.fonts.arabicBody.medium,
            fontSize: 14,
            color: theme.colors.brown,
            textAlign: 'center',
          }}
        >
          {`${ratingLabel} · ${log.overall_rating}.0`}
        </Text>
      </View>

      <SectionDivider />

      {/* SECTION 9: ACTIONS */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignSelf: 'center',
            gap: 48,
          }}
        >
          <Pressable onPress={comingSoon} hitSlop={6} style={{ padding: 8, alignItems: 'center' }}>
            <Feather name="heart" size={22} color={theme.colors.muted} />
          </Pressable>
          <Pressable onPress={comingSoon} hitSlop={6} style={{ padding: 8, alignItems: 'center' }}>
            <Feather name="share-2" size={22} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
