import React from 'react';
import { Languages, Check, Globe } from 'lucide-react';
import { PanelCard, SettingRow } from './SettingsSharedComponents';
import { LanguageManager } from '../../../services/LanguageManager';
import { AudioManager } from '../../../services/AudioManager';

interface LanguageTabProps {
    settings: any;
    updateSettings: (s: any) => void;
    isPt: boolean;
    isEs: boolean;
}

export const LanguageTab: React.FC<LanguageTabProps> = ({ settings, updateSettings, isPt, isEs }) => {
    const languageManager = LanguageManager.getInstance();
    const currentLang = languageManager.getCurrentLanguage();

    const availableLanguages = [
        {
            code: 'pt-BR',
            shortCode: 'pt',
            name: 'Português (Brasil)',
            nativeName: 'Português',
            flag: '🇧🇷',
            descPt: 'Traduções originais em português do Brasil para todos os menus e HUD',
            descEn: 'Original Brazilian Portuguese translations for all menus and HUD',
            descEs: 'Traducciones originales en portugués brasileño para menús e interfaz',
        },
        {
            code: 'en-US',
            shortCode: 'en',
            name: 'English (US)',
            nativeName: 'English',
            flag: '🇺🇸',
            descPt: 'Tradução completa em inglês americano para menús, avisos e diálogos',
            descEn: 'Full American English translation for menus, alerts, and dialogues',
            descEs: 'Traducción completa en inglés americano para menús y diálogos',
        },
        {
            code: 'es-ES',
            shortCode: 'es',
            name: 'Español',
            nativeName: 'Español',
            flag: '🇪🇸',
            descPt: 'Tradução completa em espanhol para menús, HUD e combates',
            descEn: 'Full Spanish translation for menus, HUD, and combat text',
            descEs: 'Traducción completa en español para todos los menús, HUD y diálogos',
        },
    ];

    const handleSelectLanguage = (code: string) => {
        AudioManager.getInstance().playSFX('confirm');
        languageManager.setLanguage(code);
        updateSettings({ language: code });
    };

    const getTitle = () => {
        if (isEs) return 'Idioma del Sistema';
        if (isPt) return 'Idioma do Sistema';
        return 'System Language';
    };

    const getSubtitle = () => {
        if (isEs) return 'Selecciona el idioma preferido para la interfaz y diálogos';
        if (isPt) return 'Selecione o idioma preferido para os menus e diálogos';
        return 'Select your preferred language for menus and in-game dialogues';
    };

    return (
        <div className="space-y-8 font-sans">
            <PanelCard
                title={getTitle()}
                subtitle={getSubtitle()}
                icon={Languages}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
                    {availableLanguages.map((lang) => {
                        const isSelected =
                            currentLang === lang.code ||
                            currentLang === lang.shortCode ||
                            (currentLang.startsWith('pt') && lang.shortCode === 'pt') ||
                            (currentLang.startsWith('en') && lang.shortCode === 'en') ||
                            (currentLang.startsWith('es') && lang.shortCode === 'es');

                        return (
                            <button
                                key={lang.code}
                                onClick={() => handleSelectLanguage(lang.code)}
                                className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 text-left cursor-pointer overflow-hidden group ${
                                    isSelected
                                        ? 'bg-gradient-to-b from-orange-500/20 to-orange-600/30 border-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.35)] scale-[1.02]'
                                        : 'bg-stone-900/40 border-white/5 hover:border-orange-500/40 text-stone-300 hover:text-white hover:bg-stone-800/50'
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 p-1 rounded-full bg-orange-500 text-white shadow-md">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <span className="text-3xl select-none">{lang.flag}</span>
                                    <div>
                                        <h4 className="font-black italic text-base uppercase tracking-wider text-white">
                                            {lang.nativeName}
                                        </h4>
                                        <span className="text-[10px] font-bold tracking-widest opacity-60 uppercase">
                                            {lang.name}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-stone-400 group-hover:text-stone-300 transition-colors leading-relaxed">
                                    {isEs ? lang.descEs : isPt ? lang.descPt : lang.descEn}
                                </p>

                                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                                        {isSelected
                                            ? (isEs ? '• ACTIVO •' : isPt ? '• ATIVO •' : '• ACTIVE •')
                                            : (isEs ? 'SELECCIONAR' : isPt ? 'SELECIONAR' : 'SELECT')}
                                    </span>
                                    <Globe size={14} className={isSelected ? 'text-orange-400' : 'text-stone-500'} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </PanelCard>
        </div>
    );
};
