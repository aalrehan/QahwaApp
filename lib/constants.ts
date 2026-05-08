export type ColorOption = {
  id: string;
  name_ar: string;
  hex: string;
};

export const CREMA_COLORS: ColorOption[] = [
  { id: 'pale_gold',      name_ar: 'ذهبي فاتح',       hex: '#E8C77A' },
  { id: 'honey',          name_ar: 'عسلي',            hex: '#D2A14A' },
  { id: 'hazelnut',       name_ar: 'بندقي',           hex: '#A87445' },
  { id: 'caramel',        name_ar: 'كراميل',          hex: '#8B5A2B' },
  { id: 'mahogany',       name_ar: 'ماهوغني',          hex: '#5C2E1A' },
  { id: 'dark_chocolate', name_ar: 'شوكولاتة داكنة',  hex: '#2E1810' },
];

export const CREMA_COLORS_BY_ID: Record<string, ColorOption> = Object.fromEntries(
  CREMA_COLORS.map((c) => [c.id, c]),
);

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'خفيف',
  2: 'معتدل',
  3: 'متوسط',
  4: 'قوي',
  5: 'طاغي',
};

export const INTENSITY_FILL_COLORS: Record<number, string> = {
  1: '#E8854A', // orangeSoft
  2: '#D2691E', // orange
  3: '#B85819',
  4: '#923E18',
  5: '#6B3A1F', // brown
};

export const OVERALL_RATING_LABELS: Record<number, string> = {
  1: 'لم تعجبني',
  2: 'مقبولة',
  3: 'جيدة',
  4: 'رائعة',
  5: 'استثنائية',
};
