export const theme = {
  colors: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    surface2: '#F4E8D8',
    border: '#C6986B',
    borderSoft: '#E8DDD0',
    brown: '#6B3A1F',
    brownDeep: '#4A2410',
    orange: '#D2691E',
    orangeSoft: '#E8854A',
    text: '#2A1F15',
    textSoft: '#5A4A3A',
    muted: '#8B7355',
    dim: '#B5A595',
  },
  fonts: {
    arabicDisplay: 'IBMPlexSansArabic',
    arabicBody: 'Tajawal',
    arabicDecorative: 'Amiri',
    englishDisplay: 'CormorantGaramond',
  },
} as const;

export type Theme = typeof theme;
