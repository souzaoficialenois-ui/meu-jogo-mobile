import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, GameSettings } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { UISoundManager } from '../../services/UISoundManager';
import { 
  Volume2, 
  Monitor, 
  Gamepad2, 
  Bell, 
  ShieldCheck, 
  ChevronLeft, 
  Languages,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Components
import { AudioTab } from './settings/AudioTab';
import { GraphicsTab } from './settings/GraphicsTab';
import { ControlsTab } from './settings/ControlsTab';
import { SubtitlesTab } from './settings/SubtitlesTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { AccountTab } from './settings/AccountTab';

type SettingsTabType = 'AUDIO' | 'GRAPHICS' | 'CONTROLS' | 'NOTIFICATIONS' | 'SUBTITLES' | 'ACCOUNT';

export const SettingsScreen: React.FC = () => {
  const { 
    settings: baseSettings, 
    updateSettings, 
    changeScene, 
    t, 
    resetGameProgress,
    currentUser,
    logout,
    deleteAccount,
    isPaused
  } = useSceneManager();

  const settings = {
    ...baseSettings,
    language: (baseSettings.language === 'pt' || baseSettings.language === 'pt-BR' || baseSettings.language?.startsWith('pt')) ? 'pt' : baseSettings.language
  };

  const isPt = settings.language === 'pt';
  const [activeTab, setActiveTab] = useState<SettingsTabType>('AUDIO');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeBinding, setActiveBinding] = useState<string | null>(null);
  const [gamepadName, setGamepadName] = useState<string | null>(null);

  useEffect(() => {
    const scanGamepads = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gps = navigator.getGamepads();
        let name: string | null = null;
        for (let i = 0; i < gps.length; i++) {
          const gp = gps[i];
          if (gp && gp.connected) {
            name = gp.id;
            break;
          }
        }
        setGamepadName(name);
      }
    };

    scanGamepads();
    window.addEventListener("gamepadconnected", scanGamepads);
    window.addEventListener("gamepaddisconnected", scanGamepads);
    const interval = setInterval(scanGamepads, 2000);

    return () => {
      window.removeEventListener("gamepadconnected", scanGamepads);
      window.removeEventListener("gamepaddisconnected", scanGamepads);
      clearInterval(interval);
    };
  }, []);

  const formatKeyCode = (code: string | undefined): string => {
    if (!code) return "---";
    let formatted = code;
    if (formatted.startsWith("Key")) formatted = formatted.substring(3);
    else if (formatted.startsWith("Digit")) formatted = formatted.substring(5);
    else if (formatted.startsWith("Arrow")) return formatted.substring(5).toUpperCase();
    return formatted.toUpperCase();
  };

  useEffect(() => {
    if (!activeBinding) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const newKey = e.code;
      const currentKeybindings = settings.keybindings || {};
      updateSettings({ keybindings: { ...currentKeybindings, [activeBinding]: newKey } });
      UISoundManager.getInstance().playSFX('confirm');
      setActiveBinding(null);
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => window.removeEventListener('keydown', handleWindowKeyDown, true);
  }, [activeBinding, settings, updateSettings]);

  const handleToggle = (key: keyof GameSettings) => {
    updateSettings({ [key]: !settings[key] });
    AudioManager.getInstance().playSFX('click');
  };

  const tabList = [
    { id: 'AUDIO' as SettingsTabType, label: t('settings_audio') || 'AUDIO', icon: Volume2 },
    { id: 'GRAPHICS' as SettingsTabType, label: t('settings_graphics') || 'GRAPHICS', icon: Monitor },
    { id: 'CONTROLS' as SettingsTabType, label: t('settings_controls') || 'CONTROLS', icon: Gamepad2 },
    { id: 'SUBTITLES' as SettingsTabType, label: isPt ? 'LEGENDAS' : 'SUBTITLES', icon: Languages },
    { id: 'NOTIFICATIONS' as SettingsTabType, label: isPt ? 'NOTIFICAÇÕES' : 'NOTIFICATIONS', icon: Bell },
    { id: 'ACCOUNT' as SettingsTabType, label: t('settings_tab_account') || 'ACCOUNT', icon: ShieldCheck }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-stone-950/60" />
        <div className="absolute left-[-5%] bottom-[-5%] opacity-40 scale-[1.1] blur-[1px]">
          <img src="/Assets/personagens/goku/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
        </div>
      </div>

      <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* HEADER */}
      <motion.header className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0">
          <div className="flex items-center gap-3 md:gap-8">
              <button 
                  onClick={() => { 
                      AudioManager.getInstance().playSFX('cancel'); 
                      changeScene(isPaused ? SceneName.PAUSE : SceneName.MAIN_MENU);
                  }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer"
              >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
              </button>
              <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                {isPt ? 'CONFIGURAÇÕES' : 'SETTINGS'}
              </h2>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">{isPt ? 'PERFIL ATUAL' : 'CURRENT PROFILE'}</span>
            <span className="text-[10px] md:text-sm font-black text-orange-500 uppercase italic tracking-widest mt-1">{currentUser?.email || (isPt ? 'CONVIDADO' : 'GUEST')}</span>
          </div>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
        
        {/* SIDEBAR */}
        <motion.div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none snap-x w-full md:w-72 shrink-0">
            {tabList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); AudioManager.getInstance().playSFX('click'); }}
                className={`
                  relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all min-w-[170px] md:w-full shrink-0 group
                  ${activeTab === tab.id ? 'bg-orange-600/20 text-white font-black italic' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                `}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : ''}`} />
                <span className="text-xs uppercase tracking-[0.2em] select-none truncate font-black">{tab.label}</span>
                {activeTab === tab.id && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 hidden md:block" />}
              </button>
            ))}
            
            <button 
              onClick={() => { setShowResetConfirm(true); AudioManager.getInstance().playSFX('click'); }}
              className="mt-auto hidden md:flex w-fit px-8 py-4 bg-stone-900/20 hover:bg-red-900/10 text-red-500/80 hover:text-red-500 rounded-xl items-center gap-3 transition-all text-[10px] font-black tracking-[0.2em] uppercase border border-white/5"
            >
              <Trash size={14} />
              <span>{isPt ? 'LIMPAR TUDO' : 'WIPE DATA'}</span>
            </button>
        </motion.div>

        {/* VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 pb-20"
            >
              {activeTab === 'AUDIO' && <AudioTab settings={settings} updateSettings={updateSettings} isPt={isPt} t={t} />}
              {activeTab === 'GRAPHICS' && <GraphicsTab settings={settings} handleToggle={handleToggle} updateSettings={updateSettings} isPt={isPt} />}
              {activeTab === 'CONTROLS' && <ControlsTab settings={settings} handleToggle={handleToggle} updateSettings={updateSettings} activeBinding={activeBinding} setActiveBinding={setActiveBinding} formatKeyCode={formatKeyCode} gamepadName={gamepadName} isPt={isPt} />}
              {activeTab === 'SUBTITLES' && <SubtitlesTab settings={settings} handleToggle={handleToggle} updateSettings={updateSettings} isPt={isPt} />}
              {activeTab === 'NOTIFICATIONS' && <NotificationsTab settings={settings} handleToggle={handleToggle} isPt={isPt} />}
              {activeTab === 'ACCOUNT' && <AccountTab currentUser={currentUser} logout={() => setShowLogoutConfirm(true)} deleteAccount={deleteAccount} setShowResetConfirm={setShowResetConfirm} isPt={isPt} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-stone-900 border border-white/10 p-8 rounded-[32px] max-w-md w-full relative z-10 text-center space-y-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                  <ShieldCheck className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-black italic text-white uppercase">{isPt ? 'SAIR DA CONTA?' : 'LOGOUT?'}</h3>
                <p className="text-stone-400 text-sm">{isPt ? 'Você precisará entrar novamente para acessar seus dados online.' : 'You will need to sign in again to access your online data.'}</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-stone-800 text-white font-black rounded-xl hover:bg-stone-700 transition-all uppercase tracking-widest text-[10px]">{isPt ? 'CANCELAR' : 'CANCEL'}</button>
                    <button onClick={() => { logout(); setShowLogoutConfirm(false); changeScene(SceneName.SPLASH_SCREEN); }} className="flex-1 py-4 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-500 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-orange-600/20">{isPt ? 'SAIR' : 'LOGOUT'}</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowResetConfirm(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-stone-900 border border-white/10 p-8 rounded-[32px] max-w-md w-full relative z-10 text-center space-y-6">
                <h3 className="text-2xl font-black italic text-white uppercase">{isPt ? 'TEM CERTEZA?' : 'ARE YOU SURE?'}</h3>
                <p className="text-stone-400 text-sm">{isPt ? 'Todo o seu progresso local será apagado permanentemente.' : 'All your local progress will be permanently erased.'}</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 bg-stone-800 text-white font-black rounded-xl hover:bg-stone-700 transition-all">{isPt ? 'CANCELAR' : 'CANCEL'}</button>
                    <button onClick={() => { resetGameProgress(); changeScene(SceneName.PRELOAD); }} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 transition-all">{isPt ? 'APAGAR' : 'DELETE'}</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3836; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #504945; }
        
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
