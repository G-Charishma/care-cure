// ============================================================
// Care&Cure — Centralized Types, Data & Currency System
// ============================================================

// ------------------------------------------------------------------
// UserPreferences — single source of truth for personalization
// ------------------------------------------------------------------
export interface UserPreferences {
  country: string;
  countryCode: string;
  language: string;
  languageCode: string;
  currencyCode: string;
  currencyLocale: string;
  location: string;
  address: string;
  locationMethod: 'gps' | 'manual' | '';
  locationConfirmed: boolean;
  onboardingComplete: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  country: '',
  countryCode: '',
  language: '',
  languageCode: '',
  currencyCode: 'USD',
  currencyLocale: 'en-US',
  location: '',
  address: '',
  locationMethod: '',
  locationConfirmed: false,
  onboardingComplete: false,
};

// ------------------------------------------------------------------
// localStorage helpers
// ------------------------------------------------------------------
const PREFS_KEY = 'carecure_prefs';

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences', e);
    throw new Error('Could not save preferences. Please try again.');
  }
}

// ------------------------------------------------------------------
// Currency Config — ISO code → formatter params
// ------------------------------------------------------------------
export interface CurrencyConfig {
  code: string;
  locale: string;
  symbol: string;
  name: string;
}

export const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', locale: 'en-IN', symbol: '₹', name: 'Indian Rupee' },
  USD: { code: 'USD', locale: 'en-US', symbol: '$', name: 'US Dollar' },
  GBP: { code: 'GBP', locale: 'en-GB', symbol: '£', name: 'British Pound' },
  CAD: { code: 'CAD', locale: 'en-CA', symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', locale: 'en-AU', symbol: 'A$', name: 'Australian Dollar' },
  EUR: { code: 'EUR', locale: 'de-DE', symbol: '€', name: 'Euro' },
  JPY: { code: 'JPY', locale: 'ja-JP', symbol: '¥', name: 'Japanese Yen' },
  SGD: { code: 'SGD', locale: 'en-SG', symbol: 'S$', name: 'Singapore Dollar' },
  AED: { code: 'AED', locale: 'ar-AE', symbol: 'AED', name: 'UAE Dirham' },
};

/**
 * Format a numeric amount using the user's selected currency and locale.
 * Uses native Intl.NumberFormat — no manual symbol concatenation.
 * NOTE: Demo prices are displayed as-is in the selected currency without
 * real exchange-rate conversion (as per the demo price rule).
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback if locale/currency unsupported
    const cfg = CURRENCY_CONFIG[currencyCode];
    const sym = cfg ? cfg.symbol : currencyCode;
    return `${sym}${amount.toFixed(2)}`;
  }
}

// ------------------------------------------------------------------
// Countries data
// ------------------------------------------------------------------
export interface Country {
  code: string;
  name: string;
  flag: string;
  currencyCode: string;
  currencyLocale: string;
  phonePrefix: string;
}

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currencyCode: 'INR', currencyLocale: 'en-IN', phonePrefix: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currencyCode: 'USD', currencyLocale: 'en-US', phonePrefix: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currencyCode: 'GBP', currencyLocale: 'en-GB', phonePrefix: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currencyCode: 'CAD', currencyLocale: 'en-CA', phonePrefix: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currencyCode: 'AUD', currencyLocale: 'en-AU', phonePrefix: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currencyCode: 'EUR', currencyLocale: 'de-DE', phonePrefix: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currencyCode: 'EUR', currencyLocale: 'fr-FR', phonePrefix: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currencyCode: 'JPY', currencyLocale: 'ja-JP', phonePrefix: '+81' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currencyCode: 'SGD', currencyLocale: 'en-SG', phonePrefix: '+65' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currencyCode: 'AED', currencyLocale: 'ar-AE', phonePrefix: '+971' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currencyCode: 'AUD', currencyLocale: 'en-NZ', phonePrefix: '+64' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currencyCode: 'USD', currencyLocale: 'en-ZA', phonePrefix: '+27' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currencyCode: 'USD', currencyLocale: 'pt-BR', phonePrefix: '+55' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currencyCode: 'USD', currencyLocale: 'es-MX', phonePrefix: '+52' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currencyCode: 'EUR', currencyLocale: 'it-IT', phonePrefix: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currencyCode: 'EUR', currencyLocale: 'es-ES', phonePrefix: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currencyCode: 'EUR', currencyLocale: 'nl-NL', phonePrefix: '+31' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currencyCode: 'EUR', currencyLocale: 'de-CH', phonePrefix: '+41' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currencyCode: 'USD', currencyLocale: 'sv-SE', phonePrefix: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currencyCode: 'USD', currencyLocale: 'nb-NO', phonePrefix: '+47' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currencyCode: 'USD', currencyLocale: 'ko-KR', phonePrefix: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currencyCode: 'USD', currencyLocale: 'zh-CN', phonePrefix: '+86' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currencyCode: 'USD', currencyLocale: 'ur-PK', phonePrefix: '+92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currencyCode: 'USD', currencyLocale: 'bn-BD', phonePrefix: '+880' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currencyCode: 'USD', currencyLocale: 'si-LK', phonePrefix: '+94' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currencyCode: 'USD', currencyLocale: 'ms-MY', phonePrefix: '+60' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currencyCode: 'USD', currencyLocale: 'en-PH', phonePrefix: '+63' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currencyCode: 'USD', currencyLocale: 'th-TH', phonePrefix: '+66' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currencyCode: 'USD', currencyLocale: 'id-ID', phonePrefix: '+62' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currencyCode: 'AED', currencyLocale: 'ar-SA', phonePrefix: '+966' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currencyCode: 'AED', currencyLocale: 'ar-QA', phonePrefix: '+974' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currencyCode: 'AED', currencyLocale: 'ar-KW', phonePrefix: '+965' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currencyCode: 'USD', currencyLocale: 'ar-EG', phonePrefix: '+20' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currencyCode: 'USD', currencyLocale: 'en-NG', phonePrefix: '+234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currencyCode: 'USD', currencyLocale: 'sw-KE', phonePrefix: '+254' },
];

// ------------------------------------------------------------------
// Languages data
// ------------------------------------------------------------------
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
];


