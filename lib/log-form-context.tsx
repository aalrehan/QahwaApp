import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

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
  flavorNoteIds?: string[];
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
  isPublic: true,
};

type LogFormContextValue = {
  currentStep: number;
  formData: LogFormData;
  setStep: (n: number) => void;
  updateData: (partial: Partial<LogFormData>) => void;
  reset: () => void;
};

const LogFormContext = createContext<LogFormContextValue | null>(null);

export function LogFormProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LogFormData>(INITIAL_DATA);

  const setStep = useCallback((n: number) => {
    setCurrentStep(Math.max(1, Math.min(6, n)));
  }, []);

  const updateData = useCallback((partial: Partial<LogFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setFormData(INITIAL_DATA);
  }, []);

  return (
    <LogFormContext.Provider value={{ currentStep, formData, setStep, updateData, reset }}>
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
    case 3:
    case 4:
    case 5:
    case 6:
      return true;
    default:
      return false;
  }
}
