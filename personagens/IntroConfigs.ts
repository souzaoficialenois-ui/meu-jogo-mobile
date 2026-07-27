import { PlayerState } from "../types";
import { SPAWN_CENTER_OFFSET } from "../constants";
import { ManifestManager } from "../services/ManifestManager";
import { FrameManager } from "../services/FrameManager";
import { AudioCacheManager } from "../services/AudioCacheManager";
import { AudioSettings } from "../src/engine/audio/AudioSettings";
import { SoundCategory } from "../src/engine/audio/AudioManifest";
import { VoiceManager } from "../src/engine/audio/VoiceManager";
import { AudioCache } from "../src/engine/audio/AudioCache";
import { AudioManager } from "../services/AudioManager";

export interface IntroContext {
  progress: number;
  worldWidth: number;
  groundY: number;
  isPlayer1: boolean;
  player: any; // Using any to avoid circular dependency with GameEngine Player class
  opponent?: any;
}

export interface CharacterIntroConfig {
  maxTime: number;
  physicsOverrideDuration?: number; // How many frames to skip default physics during intro
  isCustomComplete?: (player: any) => boolean;
  update: (ctx: IntroContext) => void;
}

const createSequentialIntro = (maxPhases: number): CharacterIntroConfig => ({
  maxTime: 600,
  isCustomComplete: (player: any) => player.ultPhase === maxPhases && player.animFinished,
  update: ({ worldWidth, groundY, isPlayer1, player }: IntroContext) => {
    const offsetMultiplier = isPlayer1 ? -1 : 1;
    player.pos.x = worldWidth / 2 + SPAWN_CENTER_OFFSET * offsetMultiplier;
    player.pos.y = groundY;
    player.state = PlayerState.INTRO;
    if (!player.ultPhase) player.ultPhase = 1;
    if (player.animFinished && player.ultPhase < maxPhases) {
      player.ultPhase++;
      player.animFinished = false;
    }
  }
});

export const CHARACTER_INTROS: Record<string, CharacterIntroConfig> = {
  "goku_black_rose": {
    maxTime: 1200,
    isCustomComplete: (player: any) => {
      const isComplete = player.ultPhase === 10 && player.animFinished;
      if (isComplete && !player.introFinalFadeStarted) {
        player.introFinalFadeStarted = true;
        AudioCache.getInstance().getOrCreateHowl("goku_black_rose_intro_final", SoundCategory.SFX).then((howl) => {
          if (howl) {
            const currentVol = howl.volume();
            howl.fade(currentVol, 0.0, 1500); // 1.5 second fade out
            setTimeout(() => {
              try {
                howl.stop();
              } catch (e) {}
            }, 1600);
          }
        }).catch(err => {
          console.error("Failed to fade out intro final sound:", err);
        });
      }
      return isComplete;
    },
    update: ({ worldWidth, groundY, isPlayer1, player, opponent }: IntroContext) => {
      const offsetMultiplier = isPlayer1 ? -1 : 1;
      player.pos.x = worldWidth / 2 + SPAWN_CENTER_OFFSET * offsetMultiplier;
      player.state = PlayerState.INTRO;
      
      if (!player.ultPhase) {
        player.ultPhase = 1;
        player.introPhaseTime = 0;
        player.voicePlayed = false;
        player.voiceStartedPlaying = false;
        player.voicePlayFailed = false;
        player.voiceEnded = false;
        player.introSfxStarted = false;
        player.introFinalSfxStarted = false;
        player.pos.y = groundY - 250; // Começa no céu
      }

      if (player.ultPhase === 1 && !player.introSfxStarted) {
        player.introSfxStarted = true;
        AudioCache.getInstance().getOrCreateHowl("goku_black_rose_intro_inicio", SoundCategory.SFX).then((howl) => {
          if (howl) {
            const settings = AudioSettings.getInstance();
            const baseVol = settings.getEffectiveVolume(SoundCategory.SFX);
            const effVol = Math.max(0, Math.min(1.0, baseVol * 1.5));
            
            const id = howl.play();
            howl.volume(effVol, id);
          } else {
            try {
              AudioManager.getInstance().playSFX("goku_black_rose_intro_inicio");
            } catch (err) {
              console.error("Failed fallback play goku_black_rose_intro_inicio:", err);
            }
          }
        }).catch(err => {
          console.error("Failed playing intro inicio custom:", err);
          try {
            AudioManager.getInstance().playSFX("goku_black_rose_intro_inicio");
          } catch (errRec) {
            console.error("Failed secondary fallback play:", errRec);
          }
        });
      }

      if (player.ultPhase === 5 && !player.introFinalSfxStarted) {
        player.introFinalSfxStarted = true;
        AudioCache.getInstance().getOrCreateHowl("goku_black_rose_intro_final", SoundCategory.SFX).then((howl) => {
          if (howl) {
            const settings = AudioSettings.getInstance();
            const baseVol = settings.getEffectiveVolume(SoundCategory.SFX);
            const effVol = Math.max(0, Math.min(1.0, baseVol * 1.5));
            
            const id = howl.play();
            howl.volume(effVol, id);
          } else {
            try {
              AudioManager.getInstance().playSFX("goku_black_rose_intro_final");
            } catch (err) {
              console.error("Failed fallback play goku_black_rose_intro_final:", err);
            }
          }
        }).catch(err => {
          console.error("Failed playing intro final custom:", err);
          try {
            AudioManager.getInstance().playSFX("goku_black_rose_intro_final");
          } catch (errRec) {
            console.error("Failed secondary fallback play:", errRec);
          }
        });
      }

      if (player.ultPhase === 1) {
        if (player.pos.y === undefined) {
          player.pos.y = groundY - 250;
        }
        if (player.pos.y < groundY) {
          player.pos.y += 3.5; // Desce do céu
        }
        if (player.pos.y >= groundY) {
          player.pos.y = groundY;
          player.ultPhase = 2;
          player.animFinished = false;
        }
      } else {
        player.pos.y = groundY;

        if (player.ultPhase === 6) {
          const hasGokuBlueOpponent = opponent && (opponent.data?.id === "goku_blue_gif");
          const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
          const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);

          if (hasGokuBlueOpponent && isVoicePackInstalled) {
            if (!player.introPhaseTime) player.introPhaseTime = 0;
            player.introPhaseTime++;

            if (!player.voicePlayed) {
              player.voiceStartedPlaying = false;
              player.voicePlayFailed = false;
              player.voiceEnded = false;

              const audioCtx = AudioCacheManager.getInstance().getAudioContext();
              if (audioCtx && player.preloadedIntroVoiceBuffer) {
                try {
                  if (audioCtx.state === 'suspended') audioCtx.resume();
                  const source = audioCtx.createBufferSource();
                  source.buffer = player.preloadedIntroVoiceBuffer;
                  const gain = audioCtx.createGain();
                  const voiceVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
                  gain.gain.setValueAtTime(0.82 * voiceVol, audioCtx.currentTime);
                  source.connect(gain);
                  gain.connect(audioCtx.destination);
                  
                  source.onended = () => {
                    player.voiceEnded = true;
                  };
                  source.start(0);
                  player.introVoiceSourceNode = source;
                  player.voiceStartedPlaying = true;
                } catch (err) {
                  console.warn("[DEBUG_AUDIO] WebAudio intro vocal play error:", err);
                  player.voicePlayFailed = true;
                }
              } else {
                player.voicePlayFailed = true;
              }
              player.voicePlayed = true;
            }

            if (player.animFinished) {
              player.ultPhase = 7;
              player.animFinished = false;
            }
          } else {
            // Normal sequential transition for other opponents or if voice pack is not installed
            if (player.animFinished) {
              player.ultPhase = 7;
              player.animFinished = false;
            }
          }
        } else if (player.ultPhase === 7) {
          const hasGokuBlueOpponent = opponent && (opponent.data?.id === "goku_blue_gif");
          const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
          const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);

          if (hasGokuBlueOpponent && isVoicePackInstalled) {
            if (!player.introPhaseTime) player.introPhaseTime = 0;
            player.introPhaseTime++;

            const isVoiceFinished = player.voiceEnded || player.voicePlayFailed || player.introPhaseTime >= 1200;
            
            if (isVoiceFinished) {
              player.ultPhase = 8;
              player.animFinished = false;
              if (player.introVoiceSourceNode) {
                try { player.introVoiceSourceNode.stop(); } catch(e) {}
                player.introVoiceSourceNode = null;
              }
            } else {
              // Keep looping the animation
              player.animFinished = false;
            }
          } else {
            if (player.animFinished) {
              player.ultPhase = 8;
              player.animFinished = false;
            }
          }
        } else {
          // Pre-trigger Goku Black Rose intro voice 2 frames before phase 6 begins (i.e. at the end of phase 5)
          if (player.ultPhase === 5) {
            const hasGokuBlueOpponent = opponent && (opponent.data?.id === "goku_blue_gif");
            const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
            const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);
            if (hasGokuBlueOpponent && isVoicePackInstalled) {
              const animObj = player.spriteConfig?.animations?.["INTRO_5"];
              const framesCount = animObj ? FrameManager.getInstance().getFrameCount(animObj) : 0;
              if (framesCount > 0 && player.animFrame >= framesCount - 2) {
                if (!player.voicePlayed) {
                  player.voiceStartedPlaying = false;
                  player.voicePlayFailed = false;
                  player.voiceEnded = false;

                  const audioCtx = AudioCacheManager.getInstance().getAudioContext();
                  if (audioCtx && player.preloadedIntroVoiceBuffer) {
                    try {
                      if (audioCtx.state === 'suspended') audioCtx.resume();
                      const source = audioCtx.createBufferSource();
                      source.buffer = player.preloadedIntroVoiceBuffer;
                      const gain = audioCtx.createGain();
                      const voiceVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
                      gain.gain.setValueAtTime(0.82 * voiceVol, audioCtx.currentTime);
                      source.connect(gain);
                      gain.connect(audioCtx.destination);
                      
                      source.onended = () => {
                        player.voiceEnded = true;
                      };
                      source.start(0);
                      player.introVoiceSourceNode = source;
                      player.voiceStartedPlaying = true;
                    } catch (err) {
                      console.warn("[DEBUG_AUDIO] WebAudio intro vocal play error:", err);
                      player.voicePlayFailed = true;
                    }
                  } else {
                    player.voicePlayFailed = true;
                  }
                  player.voicePlayed = true;
                }
              }
            }
          }

          // Simple sequential transition for all other phases
          if (player.animFinished && player.ultPhase < 10) {
            player.ultPhase++;
            player.animFinished = false;
            if (player.ultPhase === 6) {
              player.introPhaseTime = 0;
              if (!player.voicePlayed) {
                player.voicePlayed = false;
              }
            }
          }
        }
      }
    }
  },
  "gojo": createSequentialIntro(4),
  "gogeta_ssj": createSequentialIntro(4),
  "gogeta_blue": createSequentialIntro(4),
  "gogeta_ssj4": createSequentialIntro(9),
  "goku_blue_gif": {
    maxTime: 1200,
    isCustomComplete: (player: any) => player.ultPhase === 5 && player.animFinished,
    update: ({ worldWidth, groundY, isPlayer1, player, opponent }: IntroContext) => {
      const offsetMultiplier = isPlayer1 ? -1 : 1;
      player.pos.x = worldWidth / 2 + SPAWN_CENTER_OFFSET * offsetMultiplier;
      player.pos.y = groundY;
      player.state = PlayerState.INTRO;
      
      if (!player.ultPhase) {
        player.ultPhase = 1;
        player.introPhaseTime = 0;
        player.voicePlayed = false;
        player.voiceStartedPlaying = false;
        player.voicePlayFailed = false;
        player.voiceEnded = false;
        player.introKiChargeVoicePlayed = false;
      }

      if (player.ultPhase === 1) {
        if (!player.introKiChargeVoicePlayed) {
          player.introKiChargeVoicePlayed = true;
          try {
            VoiceManager.getInstance().playVoice(
              "/Assets/SONS/EFEITOS/CARREGANDO%20KI/INICIO.m4a"
            );
          } catch (err) {
            console.error("Failed to play Goku Blue intro charging voice:", err);
          }
        }

        // Pre-trigger Goku Blue intro voice 2 frames before phase 2 begins (i.e. at the end of phase 1)
        const hasGokuRoseOpponent = opponent && (opponent.data?.id === "goku_black_rose");
        const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
        const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);
        if (hasGokuRoseOpponent && isVoicePackInstalled) {
          const animObj = player.spriteConfig?.animations?.["INTRO_1"];
          const framesCount = animObj ? FrameManager.getInstance().getFrameCount(animObj) : 0;
          if (framesCount > 0 && player.animFrame >= framesCount - 2) {
            if (!player.voicePlayed) {
              player.voiceStartedPlaying = false;
              player.voicePlayFailed = false;
              player.voiceEnded = false;

              const audioCtx = AudioCacheManager.getInstance().getAudioContext();
              if (audioCtx && player.preloadedIntroVoiceBuffer) {
                try {
                  if (audioCtx.state === 'suspended') audioCtx.resume();
                  const source = audioCtx.createBufferSource();
                  source.buffer = player.preloadedIntroVoiceBuffer;
                  const gain = audioCtx.createGain();
                  const voiceVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
                  gain.gain.setValueAtTime(0.82 * voiceVol, audioCtx.currentTime);
                  source.connect(gain);
                  gain.connect(audioCtx.destination);
                  
                  source.onended = () => {
                     player.voiceEnded = true;
                  };
                  source.start(0);
                  player.introVoiceSourceNode = source;
                  player.voiceStartedPlaying = true;
                } catch (err) {
                  console.warn("[DEBUG_AUDIO] WebAudio intro vocal play error:", err);
                  player.voicePlayFailed = true;
                }
              } else {
                player.voicePlayFailed = true;
              }
              player.voicePlayed = true;
            }
          }
        }

        if (player.animFinished) {
          player.ultPhase = 2;
          player.animFinished = false;
          player.introPhaseTime = 0;
          if (!player.voicePlayed) {
            player.voicePlayed = false;
          }
        }
      } else if (player.ultPhase === 2) {
        const hasGokuRoseOpponent = opponent && (opponent.data?.id === "goku_black_rose");
        const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
        const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);

        // Wait for the Phase 1 TRANSFORMAÇÃO voice to finish playing before proceeding to Phase 3
        const mainVoiceUrl = "/Assets/SONS/EFEITOS/CARREGANDO%20KI/INICIO.m4a";
        const isMainVoicePlaying = VoiceManager.getInstance().isVoicePlaying(mainVoiceUrl);

        if (isMainVoicePlaying) {
          // Keep looping Phase 2 animation and do not advance yet
          player.animFinished = false;
        } else {
          // Main voice has finished, now handle either Goku Black Rose duel dialogue or proceed to Phase 3
          if (hasGokuRoseOpponent && isVoicePackInstalled) {
            if (!player.introPhaseTime) player.introPhaseTime = 0;
            player.introPhaseTime++;

            if (!player.voicePlayed) {
              player.voiceStartedPlaying = false;
              player.voicePlayFailed = false;
              player.voiceEnded = false;

              const audioCtx = AudioCacheManager.getInstance().getAudioContext();
              if (audioCtx && player.preloadedIntroVoiceBuffer) {
                try {
                  if (audioCtx.state === 'suspended') audioCtx.resume();
                  const source = audioCtx.createBufferSource();
                  source.buffer = player.preloadedIntroVoiceBuffer;
                  const gain = audioCtx.createGain();
                  const voiceVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
                  gain.gain.setValueAtTime(0.82 * voiceVol, audioCtx.currentTime);
                  source.connect(gain);
                  gain.connect(audioCtx.destination);
                  
                  source.onended = () => {
                    player.voiceEnded = true;
                  };
                  source.start(0);
                  player.introVoiceSourceNode = source;
                  player.voiceStartedPlaying = true;
                } catch (err) {
                  console.warn("[DEBUG_AUDIO] WebAudio intro vocal play error:", err);
                  player.voicePlayFailed = true;
                }
              } else {
                player.voicePlayFailed = true;
              }
              player.voicePlayed = true;
            }

            if (player.animFinished) {
              player.ultPhase = 3;
              player.animFinished = false;
            }
          } else {
            // Proceed normally on animation finish
            if (player.animFinished) {
              player.ultPhase = 3;
              player.animFinished = false;
            }
          }
        }
      } else if (player.ultPhase === 3) {
        if (player.animFinished) {
          player.ultPhase = 4;
          player.animFinished = false;
        }
      } else if (player.ultPhase === 4) {
        const hasGokuRoseOpponent = opponent && (opponent.data?.id === "goku_black_rose");
        const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
        const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);

        if (hasGokuRoseOpponent && isVoicePackInstalled) {
          if (!player.introPhaseTime) player.introPhaseTime = 0;
          player.introPhaseTime++;

          const isVoiceFinished = player.voiceEnded || player.voicePlayFailed || player.introPhaseTime >= 1200;
          
          if (isVoiceFinished) {
            player.ultPhase = 5;
            player.animFinished = false;
            if (player.introVoiceSourceNode) {
              try { player.introVoiceSourceNode.stop(); } catch(e) {}
              player.introVoiceSourceNode = null;
            }
          } else {
            player.animFinished = false;
          }
        } else {
          if (player.animFinished) {
            player.ultPhase = 5;
            player.animFinished = false;
          }
        }
      } else if (player.ultPhase === 5) {
        // Stop at phase 5 as intro only goes up to phase 5 now
      }
    }
  },
  "goku_ssj": createSequentialIntro(6),
  "goku_base": createSequentialIntro(12),
  "goku_base_swl_removed": createSequentialIntro(12),
  "goku_mui": createSequentialIntro(6),
  "vegeta_base": {
    maxTime: 240,
    physicsOverrideDuration: 180,
    update: ({ progress, worldWidth, groundY, isPlayer1, player }) => {
      const offsetMultiplier = isPlayer1 ? -1 : 1;
      player.pos.x = worldWidth / 2 + SPAWN_CENTER_OFFSET * offsetMultiplier;
      if (progress < 45) {
        player.state = PlayerState.INTRO;
        player.ultPhase = 1;
        const startY = groundY - 250;
        player.pos.y = startY + (groundY - startY) * (progress / 45);
      } else if (progress < 120) {
        player.pos.y = groundY;
        player.state = PlayerState.INTRO;
        player.ultPhase = 2;
      } else {
        player.pos.y = groundY;
        player.state = PlayerState.INTRO;
        player.ultPhase = 3;
      }
    }
  },
  "vegeta_ego": createSequentialIntro(4),
  "vegeta_ssj_majin": createSequentialIntro(8),
  "frieza_final": createSequentialIntro(9),
  "majin_buu_gohan": createSequentialIntro(5),
  "piccolo": createSequentialIntro(5),
  "teen_gohan_ssj2": createSequentialIntro(7),
  "kuririn": createSequentialIntro(7),
  "broly_ikari": createSequentialIntro(8),
  "trunks_ssj2": {
    maxTime: 600, // Standard max time for intros
    isCustomComplete: (player) => player.ultPhase === 5 && player.animFinished,
    update: ({ worldWidth, groundY, isPlayer1, player }) => {
      const offsetMultiplier = isPlayer1 ? -1 : 1;
      player.pos.x = worldWidth / 2 + SPAWN_CENTER_OFFSET * offsetMultiplier;
      player.pos.y = groundY;
      player.state = PlayerState.INTRO;
      if (!player.ultPhase) player.ultPhase = 1;
      if (player.animFinished && player.ultPhase < 5) {
        player.ultPhase++;
        player.animFinished = false;
      }
    }
  }
};
