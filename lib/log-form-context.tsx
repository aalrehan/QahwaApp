import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import type { CoffeeLog } from '@/lib/types';

export type CafeSelection = {
  id?: string;
  name_ar: string;
  city: string;
};

export type LogFormData = {
  cafe: CafeSelection | null;
  drinkName: string;
  brewMethod: string;
  origin: string;
  cupDescription: string;
  aromaNotes?: string;
  aromaIntensity?: number;
  cremaRating?: number;
  cremaColor?: string;
  flavorNoteIds: string[];
  body?: string;
  mouthfeel?: string;
  overallRating?: number;
  notes?: string;
  isPublic: boolean;
};

const INITIAL_DATA: LogFormData = {
  cafe: null,
  drinkName: '',
  brewMethod: '',
  origin: '',
  cupDescription: '',
  flavorNoteIds: [],
  isPublic: true,
};

const HALF_DURATION = 110;
const SLIDE_DISTANCE = 30;

type LogFormContextValue = {
  currentStep: number;
  formData: LogFormData;
  setStep: (n: number) => void;
  updateData: (partial: Partial<LogFormData>) => void;
  populate: (log: CoffeeLog) => void;
  reset: () => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
};

const LogFormContext = createContext<LogFormContextValue | null>(null);

export function LogFormProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LogFormData>(INITIAL_DATA);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animatingRef = useRef(false);

  const setStep = useCallback(
    (newStep: number) => {
      const target = Math.max(1, Math.min(6, newStep));
      if (animatingRef.current) return;
      if (target === currentStep) return;

      const forward = target > currentStep;
      const outSlide = forward ? -SLIDE_DISTANCE : SLIDE_DISTANCE;
      const inSlide = forward ? SLIDE_DISTANCE : -SLIDE_DISTANCE;

      animatingRef.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: HALF_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: outSlide,
          duration: HALF_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(target);
        slideAnim.setValue(inSlide);
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: HALF_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: HALF_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          animatingRef.current = false;
        });
      });
    },
    [currentStep, fadeAnim, slideAnim],
  );

  const updateData = useCallback((partial: Partial<LogFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  // Pre-fill the form from an existing log for edit mode.
  // cup_description was merged into notes on save and can't be cleanly
  // un-merged, so it stays empty here and the merged text shows in `notes`.
  const populate = useCallback((log: CoffeeLog) => {
    setFormData({
      cafe: log.cafe
        ? { id: log.cafe.id, name_ar: log.cafe.name_ar, city: log.cafe.city ?? '' }
        : null,
      drinkName: log.drink_name,
      brewMethod: log.brew_method,
      origin: log.origin ?? '',
      cupDescription: '',
      aromaNotes: log.aroma_notes ?? '',
      aromaIntensity: log.aroma_intensity ?? 0,
      cremaRating: log.crema_rating ?? 0,
      cremaColor: log.crema_color ?? '',
      flavorNoteIds: log.flavor_notes.map((f) => f.id),
      body: log.body ?? '',
      mouthfeel: log.mouthfeel ?? '',
      overallRating: log.overall_rating ?? 0,
      notes: log.notes ?? '',
      isPublic: log.is_public,
    });
    setCurrentStep(1);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
  }, [fadeAnim, slideAnim]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setFormData(INITIAL_DATA);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    animatingRef.current = false;
  }, [fadeAnim, slideAnim]);

  return (
    <LogFormContext.Provider
      value={{ currentStep, formData, setStep, updateData, populate, reset, fadeAnim, slideAnim }}
    >
      {children}
    </LogFormContext.Provider>
  );
}

export function useLogForm(): LogFormContextValue {
  const ctx = useContext(LogFormContext);
  if (!ctx) {
    throw new Error('useLogForm must be used inside LogFormProvider');
  }
  return ctx;
}

// True when the user has entered anything worth warning about before discard.
export function hasFormData(data: LogFormData): boolean {
  return (
    data.cafe !== null ||
    data.drinkName.trim().length > 0 ||
    data.brewMethod !== '' ||
    (data.aromaNotes?.trim().length ?? 0) > 0 ||
    data.flavorNoteIds.length > 0 ||
    (data.overallRating ?? 0) > 0
  );
}

export function isStepValid(step: number, data: LogFormData): boolean {
  switch (step) {
    case 1:
      return (
        data.cafe !== null &&
        data.drinkName.trim().length >= 2 &&
        data.drinkName.trim().length <= 100 &&
        data.brewMethod !== ''
      );
    case 2:
      return true;
    case 3:
      return (
        (data.aromaNotes ?? '').trim().length >= 5 &&
        (data.aromaIntensity ?? 0) >= 1
      );
    case 4:
      // Only reached when brewMethod === 'إسبريسو' (skipped otherwise via getNextStep).
      return (data.cremaRating ?? 0) >= 1 && !!data.cremaColor;
    case 5:
      return data.flavorNoteIds.length >= 1;
    case 6:
      return (
        !!data.body &&
        !!data.mouthfeel &&
        (data.overallRating ?? 0) >= 1
      );
    default:
      return false;
  }
}

// Crema is a physical property of espresso only. Step 4 (Visual/Crema) is
// conditionally skipped for non-espresso brew methods.
export function isEspresso(brewMethod: string): boolean {
  return brewMethod.trim() === 'إسبريسو';
}

export function getNextStep(step: number, data: LogFormData): number {
  if (step === 3 && !isEspresso(data.brewMethod)) return 5;
  return step + 1;
}

export function getPrevStep(step: number, data: LogFormData): number {
  if (step === 5 && !isEspresso(data.brewMethod)) return 3;
  return step - 1;
}

// For StepHeader: visual step counter that hides Step 4 from the count
// when the user is on a non-espresso flow.
export function getDisplayStep(
  step: number,
  brewMethod: string,
): { displayStep: number; totalSteps: number } {
  const espresso = isEspresso(brewMethod);
  const totalSteps = espresso ? 6 : 5;
  const displayStep = espresso ? step : step > 4 ? step - 1 : step;
  return { displayStep, totalSteps };
}
