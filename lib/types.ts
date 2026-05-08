export type FlavorNoteSummary = {
  id: string;
  name_ar: string;
  color_hex: string | null;
  emoji: string | null;
  level: number;
};

export type CafeSummary = {
  id: string;
  name_ar: string;
  city: string | null;
};

export type ProfileSummary = {
  username: string;
  display_name_ar: string | null;
  city: string | null;
};

export type CoffeeLog = {
  id: string;
  user_id: string;
  cafe_id: string | null;
  drink_name: string;
  brew_method: string;
  origin: string | null;
  photo_url: string | null;
  aroma_notes: string;
  aroma_intensity: number;
  crema_rating: number;
  crema_color: string;
  body: string;
  mouthfeel: string;
  overall_rating: number;
  notes: string | null;
  is_public: boolean;
  created_at: string;
  cafe: CafeSummary | null;
  profile: ProfileSummary | null;
  flavor_notes: FlavorNoteSummary[];
};

// Raw row shape returned by Supabase before flattening the
// log_flavor_notes nested join.
export type RawCoffeeLogRow = Omit<CoffeeLog, 'flavor_notes'> & {
  log_flavor_notes:
    | { flavor_note: FlavorNoteSummary | null }[]
    | null;
};
