import enUS from "../lang/en-US.json";
import ptBR from "../lang/pt-BR.json";
import { TRANSLATIONS } from "../constants/translations";

export interface TranslationMap {
  [key: string]: string;
}

export interface LanguageInfo {
  name: string;
  flag: string;
  translations: TranslationMap;
}

export interface LanguagesConfig {
  [lang: string]: LanguageInfo;
}

export class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: string = "pt-BR";
  private listeners: Set<(lang: string) => void> = new Set();

  private languages: LanguagesConfig = {
    "pt-BR": {
      name: "Português",
      flag: "🇧🇷",
      translations: ptBR as unknown as TranslationMap,
    },
    "en-US": {
      name: "English",
      flag: "🇺🇸",
      translations: enUS as unknown as TranslationMap,
    },
    "es-ES": {
      name: "Español",
      flag: "🇪🇸",
      translations: {} as TranslationMap,
    },
    "ja-JP": {
      name: "日本語",
      flag: "🇯🇵",
      translations: {} as TranslationMap,
    },
    "zh-CN": {
      name: "中文",
      flag: "🇨🇳",
      translations: {} as TranslationMap,
    },
    "ko-KR": {
      name: "한국어",
      flag: "🇰🇷",
      translations: {} as TranslationMap,
    },
    "fr-FR": {
      name: "Français",
      flag: "🇫🇷",
      translations: {} as TranslationMap,
    },
    "ar-SA": {
      name: "العربية",
      flag: "🇸🇦",
      translations: {} as TranslationMap,
    }
  };

  private constructor() {
    // Load persisted language selection
    const saved = localStorage.getItem("game_language");
    if (saved && this.languages[saved]) {
      this.currentLanguage = saved;
    } else {
      // Auto-detect or default to pt-BR as fallback
      const browserLang = typeof navigator !== "undefined" ? navigator.language : "pt-BR";
      if (browserLang.startsWith("en")) {
        this.currentLanguage = "en-US";
      } else {
        this.currentLanguage = "pt-BR";
      }
    }
  }

  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getLanguages(): LanguagesConfig {
    return this.languages;
  }

  public setLanguage(lang: string) {
    let resolvedLang = lang;
    if (lang === "en") resolvedLang = "en-US";
    if (lang === "pt") resolvedLang = "pt-BR";

    if (this.languages[resolvedLang]) {
      this.currentLanguage = resolvedLang;
      localStorage.setItem("game_language", resolvedLang);
      this.notifyListeners();
    }
  }

  public addListener(listener: (lang: string) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentLanguage);
      } catch (err) {
        console.error("Language notification error:", err);
      }
    });
  }

  public translate(key: string, variables?: Record<string, string | number>): string {
    // 1. Resolve current language translations
    let text = this.languages[this.currentLanguage]?.translations?.[key];
    
    // 2. Fallbacks
    if (!text && this.currentLanguage !== "pt-BR") {
      text = this.languages["pt-BR"]?.translations?.[key];
    }
    if (!text) {
      text = this.languages["en-US"]?.translations?.[key];
    }
    
    // 3. Fallback to old translations constants object as final guard
    if (!text) {
      const mappedOldLang = this.currentLanguage.startsWith("pt") ? "pt" : "en";
      const oldTranslations = (TRANSLATIONS as any)[mappedOldLang];
      const defaultOldTranslations = (TRANSLATIONS as any)["pt"] || (TRANSLATIONS as any)["en"];
      text = oldTranslations?.[key] || defaultOldTranslations?.[key];
    }

    if (!text) return key;

    // Dynamic variable interpolation
    if (variables) {
      Object.keys(variables).forEach(varKey => {
        text = text!.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(variables[varKey]));
      });
    }

    return text;
  }
}
