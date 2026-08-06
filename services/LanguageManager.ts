import enUS from "../lang/en-US.json";
import ptBR from "../lang/pt-BR.json";
import esES from "../lang/es-ES.json";
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
      translations: esES as unknown as TranslationMap,
    },
    "ja-JP": {
      name: "日本語",
      flag: "🇯🇵",
      translations: {
        you_win: "勝利",
        you_lose: "敗北",
        result_victory: "勝利",
        result_defeat: "敗北"
      } as TranslationMap,
    },
    "zh-CN": {
      name: "中文",
      flag: "🇨🇳",
      translations: {
        you_win: "你赢了",
        you_lose: "你输了",
        result_victory: "胜利",
        result_defeat: "失败"
      } as TranslationMap,
    },
    "ko-KR": {
      name: "한국어",
      flag: "🇰🇷",
      translations: {
        you_win: "승리",
        you_lose: "패배",
        result_victory: "승리",
        result_defeat: "패배"
      } as TranslationMap,
    },
    "fr-FR": {
      name: "Français",
      flag: "🇫🇷",
      translations: {
        you_win: "VOUS AVEZ GAGNÉ",
        you_lose: "VOUS AVEZ PERDU",
        result_victory: "VICTOIRE",
        result_defeat: "DÉFAITE"
      } as TranslationMap,
    },
    "ar-SA": {
      name: "العربية",
      flag: "🇸🇦",
      translations: {
        you_win: "لقد فزت",
        you_lose: "لقد خسرت",
        result_victory: "انتصار",
        result_defeat: "هزيمة"
      } as TranslationMap,
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
    if (lang === "en" || lang === "en-US") resolvedLang = "en-US";
    if (lang === "pt" || lang === "pt-BR") resolvedLang = "pt-BR";
    if (lang === "es" || lang === "es-ES") resolvedLang = "es-ES";

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
