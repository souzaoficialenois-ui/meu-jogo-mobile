import React from 'react';
import { Languages, Globe } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';

interface SubtitlesTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    updateSettings: (s: any) => void;
    isPt: boolean;
}

export const SubtitlesTab: React.FC<SubtitlesTabProps> = ({ settings, handleToggle, updateSettings, isPt }) => (
    <div className="space-y-8">
        <PanelCard title={isPt ? 'Legendas' : 'Subtitles'} subtitle={isPt ? 'Personalize o texto na tela' : 'Customize on-screen text'} icon={Languages}>
            <SettingRow label={isPt ? 'Exibir Legendas' : 'Show Subtitles'} description={isPt ? 'Mostra diálogos durante as lutas e menus' : 'Shows dialogues during combat and menus'}>
                <Toggle active={settings.subtitlesEnabled} onToggle={() => handleToggle('subtitlesEnabled')} />
            </SettingRow>
            <SettingRow label={isPt ? 'Fundo da Legenda' : 'Subtitle Background'} description={isPt ? 'Adiciona uma tarja preta atrás do texto' : 'Adds a black strip behind the text'}>
                <Toggle active={settings.subtitleBackground} onToggle={() => handleToggle('subtitleBackground')} />
            </SettingRow>
        </PanelCard>

        <PanelCard title={isPt ? 'Idioma da Interface' : 'Interface Language'} icon={Globe}>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: 'pt', label: 'Português', sub: 'Brasil' },
                    { id: 'en', label: 'English', sub: 'United States' }
                ].map((lang) => {
                    const isSelected = settings.language === lang.id;
                    return (
                        <button
                            key={lang.id}
                            onClick={() => updateSettings({ language: lang.id })}
                            className={`p-6 rounded-2xl border-2 transition-all text-left group ${
                                isSelected 
                                ? 'bg-orange-600/20 border-orange-500 shadow-lg' 
                                : 'bg-stone-900/40 border-white/5 hover:border-stone-700'
                            }`}
                        >
                            <h4 className={`font-black italic uppercase text-lg tracking-widest ${isSelected ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`}>
                                {lang.label}
                            </h4>
                            <p className="text-[10px] font-black uppercase text-stone-600 mt-1 tracking-widest">{lang.sub}</p>
                        </button>
                    );
                })}
            </div>
        </PanelCard>
    </div>
);
