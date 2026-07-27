
import React, { useEffect, useState } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SceneProvider, useSceneManager } from './contexts/SceneContext';
import { MainMenuScreen } from './components/screens/MainMenuScreen';
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen';
import { WarehouseScreen } from './components/screens/WarehouseScreen';
import { BattleScreen } from './components/BattleScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { PauseScreen } from './components/screens/PauseScreen';
import { EvolutionScreen } from './components/screens/EvolutionScreen';
import { SummonScreen } from './components/screens/SummonScreen';
import { ProfileCreationScreen } from './components/screens/ProfileCreationScreen';
import { ProfileEditScreen } from './components/screens/ProfileEditScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { MessagesScreen } from './components/screens/MessagesScreen';
import { MissionScreen } from './components/screens/MissionScreen';
import { StrikePassScreen } from './components/screens/StrikePassScreen';
import { HUDEditorScreen } from './components/screens/HUDEditorScreen';
import { MultiplayerScreen } from './components/screens/MultiplayerScreen';
import { PreloadScreen } from './components/screens/PreloadScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { TournamentScreen } from './components/screens/TournamentScreen'; 
import { ModeSelectionScreen } from './components/screens/ModeSelectionScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { NetworkSelectScreen } from './components/screens/NetworkSelectScreen';
import { AdminPanelScreen } from './components/screens/AdminPanelScreen';
import { SocialScreen } from './components/screens/SocialScreen';
import { FriendsManagementScreen } from './components/screens/FriendsManagementScreen';
import { PrivateChatScreen } from './components/screens/PrivateChatScreen';
import { BattleCharacterSelectionScreen } from './components/screens/BattleCharacterSelectionScreen';
import { TeamSizeSelectScreen } from './components/screens/TeamSizeSelectScreen';
import { VsScreen } from './components/screens/VsScreen';
import { StageSelectScreen } from './components/screens/StageSelectScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { StoryScreen } from './components/screens/StoryScreen';
import { SplashScreen } from './components/screens/SplashScreen';
import { ResourceDownloadScreen } from './components/screens/ResourceDownloadScreen';
import { SideSelectionScreen } from './components/screens/SideSelectionScreen';
import { CreditsScreen } from './components/screens/CreditsScreen';
import { GlobalChatOverlay } from './components/GlobalChatOverlay';
import { SceneName } from './types';
import { AVATAR_LIST } from './constants';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationManager } from './services/NotificationManager';
import { OnlineService, OnlineStatus } from './services/OnlineService';
import { Shield } from 'lucide-react';
import { AnimationPreviewScreen } from './components/screens/AnimationPreviewScreen';
import { HallOfFameScreen } from './components/screens/HallOfFameScreen';
import { GamepadNavigationManager } from './services/GamepadNavigationManager';
import { UIManager } from './services/UIManager';
import { PlayerProfileModal } from './components/social/PlayerProfileModal';
import { LobbyService } from './services/LobbyService';
import { db } from './services/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { AudioManager } from './services/AudioManager';
import { StrictVersionBlockScreen } from './components/screens/StrictVersionBlockScreen';
import { NetworkManager } from './services/NetworkManager';
import { ReconnectionScreen } from './components/screens/ReconnectionScreen';
import { UIProvider } from './contexts/UIContext';

const SceneContainer: React.FC = () => {
  const { 
    currentScene, 
    changeScene, 
    currentUser, 
    playerProfile,
    showProfileId, 
    setShowProfileId,
    setAutoJoinRoomId,
    sessionConflict,
    setSessionConflict,
    gameEngine
  } = useSceneManager();

  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [inviteCountdown, setInviteCountdown] = useState<number>(30);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('LOADING');

  const [reconnectRoomId, setReconnectRoomId] = useState<string | null>(null);
  const [reconnectIsHost, setReconnectIsHost] = useState<boolean>(false);

  // Check for active match on boot/refresh
  useEffect(() => {
    const savedRoomId = localStorage.getItem("current_online_room_id");
    const savedIsHost = localStorage.getItem("is_online_host") === "true";
    if (savedRoomId) {
      const lobby = LobbyService.getInstance();
      lobby.getRoom(savedRoomId).then(room => {
        if (room && (room.status === 'BATTLE' || room.status === 'VS')) {
          console.log("Active online match found. Restoring game scene...");
          setReconnectRoomId(savedRoomId);
          setReconnectIsHost(savedIsHost);
        } else {
          localStorage.removeItem("current_online_room_id");
        }
      }).catch(() => {
        localStorage.removeItem("current_online_room_id");
      });
    }
  }, []);

  // Monitor network disconnects during gameplay
  useEffect(() => {
    const net = NetworkManager.getInstance();
    const originalOnDisconnect = net.onDisconnect;
    
    net.onDisconnect = () => {
      if (originalOnDisconnect) {
        try { originalOnDisconnect(); } catch (e) {}
      }
      
      const activeRoomId = localStorage.getItem("current_online_room_id");
      const activeIsHost = localStorage.getItem("is_online_host") === "true";
      const isFightScene = currentScene === SceneName.BATTLE || currentScene === SceneName.VS_SCREEN;
      
      if (activeRoomId && isFightScene) {
        console.log("P2P connection lost. Triggering reconnection overlay...");
        setReconnectRoomId(activeRoomId);
        setReconnectIsHost(activeIsHost);
        
        if (gameEngine) {
          gameEngine.isPausedForReconnection = true;
        }
      }
    };
    
    return () => {
      net.onDisconnect = originalOnDisconnect;
    };
  }, [currentScene, gameEngine]);

  useEffect(() => {
    return OnlineService.subscribe((status) => {
      setOnlineStatus(status);
    });
  }, []);

  // Live online status / presence manager
  useEffect(() => {
    if (!currentUser) return;

    const updatePresence = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        let status = 'ONLINE';
        
        const isCombatScene = currentScene === SceneName.BATTLE || currentScene === SceneName.TRAINING;
        if (isCombatScene) {
          status = 'PLAYING';
        } else if (currentScene === SceneName.MULTIPLAYER) {
          status = 'BUSY';
        }

        // Ensure the document exists or merge status
        await setDoc(userRef, { status }, { merge: true });
      } catch (e) {
        console.error("Presence status update failed:", e);
      }
    };

    updatePresence();

    // On unmount/unload set to OFFLINE
    return () => {
      const userRef = doc(db, 'users', currentUser.uid);
      setDoc(userRef, { status: 'OFFLINE' }, { merge: true }).catch(console.error);
    };
  }, [currentUser, currentScene]);

  // Real-time room invitation listener
  useEffect(() => {
    if (!currentUser) {
      setActiveInvite(null);
      return;
    }

    const unsub = LobbyService.getInstance().subscribeToInvites(currentUser.uid, (invite) => {
      // Validate that we are "free" (not in a battle, versus, or loading)
      const isCombatScene = currentScene === SceneName.BATTLE || currentScene === SceneName.TRAINING || currentScene === SceneName.VS_SCREEN;
      if (isCombatScene) {
        console.log("Player is in combat, ignoring incoming invite.");
        return;
      }

      // Play SFX
      AudioManager.getInstance().playSFX('confirm');

      // Set active invitation
      setActiveInvite(invite);
    });

    return unsub;
  }, [currentUser, currentScene]);

  // Countdown timer for active invitation
  useEffect(() => {
    if (!activeInvite) return;

    const interval = setInterval(() => {
      const timeDiff = activeInvite.expiresAt - Date.now();
      if (timeDiff <= 0) {
        setActiveInvite(null);
        clearInterval(interval);
      } else {
        setInviteCountdown(Math.ceil(timeDiff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvite]);

  const handleAcceptInvite = async () => {
    if (!activeInvite) return;
    AudioManager.getInstance().playSFX('confirm');
    const invite = activeInvite;
    setActiveInvite(null);

    // Update invite status in Firestore
    await LobbyService.getInstance().respondToInvite(invite.id, 'ACCEPTED');

    // Check if room exists
    const exists = await LobbyService.getInstance().checkRoomExists(invite.roomId);
    if (!exists) {
      alert("Esta sala de partida já não está mais disponível.");
      return;
    }

    // Set room ID for auto-joining and change scene
    setAutoJoinRoomId(invite.roomId);
    changeScene(SceneName.MULTIPLAYER);
  };

  const handleDeclineInvite = async () => {
    if (!activeInvite) return;
    AudioManager.getInstance().playSFX('cancel');
    await LobbyService.getInstance().respondToInvite(activeInvite.id, 'DECLINED');
    setActiveInvite(null);
  };

  useEffect(() => {
    // In active battle or training, standard gameplay gamepad controls are used instead of UI navigation.
    const isCombatScene = currentScene === SceneName.BATTLE || currentScene === SceneName.TRAINING;
    if (isCombatScene) {
      GamepadNavigationManager.getInstance().stop();
    } else {
      GamepadNavigationManager.getInstance().start();
    }
    return () => {
      GamepadNavigationManager.getInstance().stop();
    };
  }, [currentScene]);

  const renderScene = () => {
    // Combat scenes group to avoid unmounting when transitioning between battle/training/pause
    const isCombatScene = currentScene === SceneName.BATTLE || currentScene === SceneName.TRAINING || currentScene === SceneName.PAUSE;

    if (isCombatScene) {
      return (
        <div className="w-full h-full relative">
          <BattleScreen />
          {currentScene === SceneName.PAUSE && <PauseScreen />}
        </div>
      );
    }

    switch (currentScene) {
      case SceneName.RESOURCE_DOWNLOAD: return <ResourceDownloadScreen />;
      case SceneName.PRELOAD: return <PreloadScreen />;
      case SceneName.SPLASH_SCREEN: return <SplashScreen />;
      case SceneName.RESULTS: return <ResultScreen />;
      case SceneName.AUTH: return <AuthScreen />;
      case SceneName.NETWORK_SELECT: return <NetworkSelectScreen />;
      case SceneName.PROFILE_CREATION: return <ProfileCreationScreen />;
      case SceneName.PROFILE_EDIT: return <ProfileEditScreen />;
      case SceneName.MESSAGES: return <MessagesScreen />;
      case SceneName.MAIN_MENU: return <MainMenuScreen />;
      case SceneName.SINGLE_PLAYER_MENU: return <ModeSelectionScreen />;
      case SceneName.CHARACTER_SELECT: return <CharacterSelectScreen />;
      case SceneName.VS_SCREEN: return <VsScreen />;
      case SceneName.MULTIPLAYER: return <MultiplayerScreen />;
      case SceneName.SHOP: return <ShopScreen />;
      case SceneName.TOURNAMENT: return <TournamentScreen />;
      case SceneName.EVOLUTION: return <EvolutionScreen />;
      case SceneName.SETTINGS: return <SettingsScreen />;
      case SceneName.GACHA: return <SummonScreen />; 
      case SceneName.SUMMON: return <SummonScreen />;
      case SceneName.MISSIONS: return <MissionScreen />;
      case SceneName.STRIKE_PASS: return <StrikePassScreen />;
      case SceneName.HUD_EDITOR: return <HUDEditorScreen />;
      case SceneName.ADMIN_PANEL: return <AdminPanelScreen />;
      case SceneName.SOCIAL: return <SocialScreen />;
      case SceneName.PROFILE: return <ProfileScreen />;
      case SceneName.FRIENDS_MANAGEMENT: return <FriendsManagementScreen />;
      case SceneName.PRIVATE_CHAT: return <PrivateChatScreen />;
      case SceneName.BATTLE_CHAR_SELECT: return <BattleCharacterSelectionScreen />;
      case SceneName.TEAM_SIZE_SELECT: return <TeamSizeSelectScreen />;
      case SceneName.STAGE_SELECT: return <StageSelectScreen />;
      case SceneName.STORY_MODE: return <StoryScreen />;
      case SceneName.ANIMATION_PREVIEW: return <AnimationPreviewScreen />;
      case SceneName.SIDE_SELECTION: return <SideSelectionScreen />;
      case SceneName.CREDITS: return <CreditsScreen />;
      case SceneName.HALL_OF_FAME: return <HallOfFameScreen />;
      case SceneName.WAREHOUSE: return <WarehouseScreen />;
      default: return <MainMenuScreen />;
    }
  };

  if (onlineStatus === 'UPDATE_REQUIRED' || onlineStatus === 'MAINTENANCE') {
    return <StrictVersionBlockScreen status={onlineStatus} />;
  }

  if (sessionConflict) {
    return (
      <div id="session-conflict-screen" className="fixed inset-0 z-[10000] bg-stone-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500 rounded-full flex items-center justify-center animate-pulse mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-header italic uppercase text-red-500 tracking-widest mb-2">Conexão Interrompida</h2>
        <p className="text-stone-300 text-sm font-bold uppercase tracking-widest max-w-md leading-relaxed mb-6">Sua conta foi conectada em outro dispositivo</p>
        <button
          onClick={() => {
            setSessionConflict(false);
            changeScene(SceneName.AUTH);
          }}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-header italic text-sm tracking-widest uppercase rounded-lg shadow-lg shadow-red-600/25 transition-all cursor-pointer"
        >
          Ir para o Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene === SceneName.BATTLE || currentScene === SceneName.TRAINING || currentScene === SceneName.PAUSE ? "combat-stage" : currentScene}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0"
          >
            {renderScene()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Player Profile Modal */}
      {showProfileId && (
        <PlayerProfileModal 
          playerId={showProfileId} 
          isOpen={!!showProfileId} 
          onClose={() => setShowProfileId(null)} 
        />
      )}

      {/* Multi-game Room Invite Notification Pop-up */}
      <AnimatePresence>
        {activeInvite && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm bg-stone-950 border-2 border-orange-500 rounded-xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div 
                onClick={() => {
                  AudioManager.getInstance().playSFX('click');
                  setShowProfileId(activeInvite.hostId);
                }}
                className="w-10 h-10 rounded-lg border border-orange-500 hover:border-orange-400 bg-stone-900 overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                <img 
                  src={AVATAR_LIST.find(a => a.id === activeInvite.hostAvatar)?.url || "/Assets/UI/avatar_placeholder.png"} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Convite Recebido</p>
                <h4 
                  onClick={() => {
                    AudioManager.getInstance().playSFX('click');
                    setShowProfileId(activeInvite.hostId);
                  }}
                  className="text-xs font-black text-white truncate uppercase italic cursor-pointer hover:text-orange-400 transition-colors"
                >
                  {activeInvite.hostName} te convidou!
                </h4>
                <p className="text-[10px] text-orange-400 font-mono mt-0.5">{activeInvite.gameMode}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono font-bold text-orange-500 px-2 py-1 bg-orange-500/10 rounded border border-orange-500/20">{inviteCountdown}s</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleDeclineInvite}
                className="flex-1 py-1 text-[10px] border border-stone-800 hover:border-red-500/30 hover:bg-red-500/10 text-stone-400 hover:text-red-400 font-black uppercase italic tracking-wider rounded-lg transition-all"
              >
                Recusar
              </button>
              <button 
                onClick={handleAcceptInvite}
                className="flex-1 py-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-[10px] font-black uppercase italic tracking-wider rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
              >
                Aceitar
              </button>
            </div>
          </motion.div>
        )}
        {reconnectRoomId && (
          <ReconnectionScreen
            roomId={reconnectRoomId}
            isHost={reconnectIsHost}
            onClose={() => setReconnectRoomId(null)}
          />
        )}
      </AnimatePresence>
      
      <GlobalChatOverlay />
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    const travarTelaDeitada = async () => {
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch (e) {
        console.log('Não está rodando no celular ou o plugin não carregou:', e);
      }
    };

    const initNotifications = async () => {
      try {
        if (
          (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') ||
          NotificationManager.getInstance().isNative()
        ) {
          await NotificationManager.getInstance().requestPermission();
        }
      } catch (err) {
        console.warn('Silent notifications init error:', err);
      }
    };

    UIManager.getInstance();
    travarTelaDeitada();
    initNotifications();
    OnlineService.initialize();
  }, []);

  const handleInteraction = async () => {
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      
      const screenObj = window.screen as any;
      if (screenObj && screenObj.orientation && screenObj.orientation.lock) {
        await screenObj.orientation.lock('landscape').catch((e: any) => console.warn('Orientation lock failed:', e));
      }
    } catch (err: any) {
      console.warn(`Error attempting to enable fullscreen: ${err.message}`);
    }
  };

  return (
    <UIProvider>
      <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden w-screen h-[100dvh]">
        <div 
          className="relative overflow-hidden bg-[#050608] text-slate-100 font-sans selection:bg-dragon-orange selection:text-white w-full h-full"
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
        >
          <div className="absolute inset-0 pointer-events-none z-[100]" />
          
          <SceneProvider>
            <SceneContainer />
          </SceneProvider>
        </div>
      </div>
    </UIProvider>
  );
};

export default App;
