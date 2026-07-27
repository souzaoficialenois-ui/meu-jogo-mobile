import { GameEngine } from "./GameEngine";
import { Projectile } from "./Projectile";
import { Genkidama } from "./Genkidama";
import { Player } from "./Player";
import { PlayerState, IntroPhase } from "../types";
import { BACKGROUND_COLOR, GROUND_COLOR, WORLD_HEIGHT, ATTACK_WIDTH, ATTACK_HEIGHT, ATTACK_OFFSET_X, ATTACK_OFFSET_Y } from "../constants";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { AnimationManager } from "./AnimationManager";
import { resolveAnimationKey } from "./AnimationResolver";
import { STAGE_DB } from "../constants/StageDatabase";
import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";
import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { EffectConfigKeyManager } from "./EffectConfigKeyManager";
import { CollisionHelper } from "./CollisionHelper";

function getStageGroundColor(stageTheme: string): string {
  const theme = (stageTheme || "").toUpperCase().trim();
  switch (theme) {
    case "TORNEIO_DO_PODER":
      return "#514f61"; // Slate grey-purple for Torneio do Poder
    case "KAME_HOUSE":
      return "#dfb382"; // Sandy beige for Kame House
    case "INSIDE_BUU":
      return "#d56a92"; // Fleshy pink for Inside Buu
    case "DESERTO":
      return "#c18249"; // Warm desert orange-brown for Deserto
    case "ESPACO":
      return "#1c1b2c"; // Deep space indigo/slate
    case "NIGHT":
      return "#0f172a"; // Night theme ground color
    case "ALIEN":
      return "#5b21b6"; // Alien theme purple ground color
    case "ARENA":
      return "#ea580c"; // Arena ring orange floor
    default:
      return GROUND_COLOR;
  }
}

export class GameRenderer {
  private engine: GameEngine;
  private currentDimAlpha: number = 0;
  public static loadedBgs: Record<string, HTMLImageElement> = {};
  private offscreenCanvas: HTMLCanvasElement | null = null;

  private getOffscreen(w: number, h: number) {
    if (!this.offscreenCanvas) {
      if (typeof document !== "undefined") {
        this.offscreenCanvas = document.createElement("canvas");
      }
    }
    const c = this.offscreenCanvas;
    if (c) {
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      const tempCtx = c.getContext("2d");
      if (tempCtx) {
        tempCtx.filter = "none";
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.setTransform(1, 0, 0, 1, 0, 0);
        tempCtx.clearRect(0, 0, w, h);
      }
      return { canvas: c, ctx: tempCtx! };
    }
    return null;
  }

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  // Inserted body:
  public render() {
    const ctx = this.engine.ctx;
    if (!ctx || !this.engine.canvas) return;

    const fgCtx = (this.engine as any).fgCtx || ctx;
    // Reset any applied transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    fgCtx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    if (fgCtx !== ctx) {
      fgCtx.scale(dpr, dpr);
      const parent = this.engine.canvas.parentElement;
      const vw = parent ? parent.clientWidth : this.engine.canvas.clientWidth;
      const vh = parent ? parent.clientHeight : this.engine.canvas.clientHeight;
      fgCtx.clearRect(0, 0, vw, vh);
    }

    const parent = this.engine.canvas.parentElement;
    const viewW = parent ? parent.clientWidth : this.engine.canvas.clientWidth;
    const viewH = parent
      ? parent.clientHeight
      : this.engine.canvas.clientHeight;
    const cam = this.engine.camera.getRenderPosition();
    const zoom = this.engine.camera.zoom;
    const p1 = this.engine.player1;
    const p2 = this.engine.player2;

    const baseTheme = (this.engine.stageTheme || "").toUpperCase().trim();
    if (baseTheme === "NIGHT") {
      ctx.fillStyle = "#020617";
    } else if (baseTheme === "ALIEN") {
      ctx.fillStyle = "#2e1065";
    } else if (baseTheme === "TORNEIO_DO_PODER") {
      ctx.fillStyle = "#1e0524";
    } else if (baseTheme === "INSIDE_BUU") {
      ctx.fillStyle = "#1e0814";
    } else if (baseTheme === "DESERTO") {
      ctx.fillStyle = "#3a201c";
    } else if (baseTheme === "ESPACO") {
      ctx.fillStyle = "#050510";
    } else if (baseTheme === "KAME_HOUSE") {
      ctx.fillStyle = "#87ceeb";
    } else {
      ctx.fillStyle = BACKGROUND_COLOR;
    }
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    fgCtx.save();
    ctx.translate(viewW / 2, viewH / 2);
    fgCtx.translate(viewW / 2, viewH / 2);
    ctx.scale(zoom, zoom);
    fgCtx.scale(zoom, zoom);
    ctx.rotate((this.engine.camera.rotation * Math.PI) / 180);
    fgCtx.rotate((this.engine.camera.rotation * Math.PI) / 180);
    ctx.translate(-cam.x, -cam.y);
    fgCtx.translate(-cam.x, -cam.y);
    this.drawBackground(ctx);
    this.drawEnvironment(ctx);

    const effMgr = EffectConfigKeyManager.getInstance();
    const animMgr = this.engine.animationManager;

    // Categorizar efeitos uma vez por frame para evitar loops redundantes e múltiplas verificações de string
    const backEffects: any[] = [];
    const midEffects: any[] = [];
    const frontEffects: any[] = [];

    for (let i = 0; i < this.engine.visualEffects.length; i++) {
      const effect = this.engine.visualEffects[i];
      if (!effect.active) continue;

      if (effect.layer === 'BACK' || effect.type === "FINAL_IMPACT_EFFECT") {
        backEffects.push(effect);
      } else if (effect.layer === 'FRONT') {
        frontEffects.push(effect);
      } else {
        // Lógica de distinção entre background (mid) e foreground baseada no tipo e imagem
        const isForegroundType =
          effect.type === "FULL_SCREEN_DUST" ||
          effect.type === "COMBO_HIT" ||
          effect.type === "COMBO_HIT_HEAVY" ||
          effect.type === "GROUND_DESTROYED" ||
          effect.type === "DOUBLE_TAP_DUST" ||
          effect.type === "CHARGING_PEDRA" ||
          effect.type === "DRAGON_RUSH_START_EFFECT" ||
          effect.type === "KAME_GENKI_COLLISION";
        
        const isDust = effect.imageUrl && effect.imageUrl.includes("efeitos/poeira");

        if (isForegroundType && !isDust) {
          frontEffects.push(effect);
        } else {
          midEffects.push(effect);
        }
      }
    }

    // Draw mid (background) visual effects
    for (let i = 0; i < midEffects.length; i++) {
      const effect = midEffects[i];
      const img = animMgr.getGifFrame(effect.imageUrl, effect.animFrame);
      if (!img) continue;

      fgCtx.save();

      let finalScaleX = effect.scale;
      let finalScaleY = effect.scale;
      let finalOffsetX = 0;
      let finalOffsetY = 0;

      if (effect.configKey) {
        const config = effMgr.getEffect(effect.configKey);
        if (config) {
          if (config.effectHueRotate || config.effectSaturate !== undefined || config.effectBrightness !== undefined || config.effectContrast !== undefined) {
             fgCtx.filter = `hue-rotate(${config.effectHueRotate || 0}deg) saturate(${config.effectSaturate ?? 1}) brightness(${config.effectBrightness ?? 1}) contrast(${config.effectContrast ?? 1})`;
          }
          if (config.effectOpacity !== undefined) fgCtx.globalAlpha = config.effectOpacity;
          if (config.effectScaleX !== undefined) finalScaleX *= config.effectScaleX;
          if (config.effectScaleY !== undefined) finalScaleY *= config.effectScaleY;
          if (config.effectOffsetX !== undefined) finalOffsetX = config.effectOffsetX;
          if (config.effectOffsetY !== undefined) finalOffsetY = config.effectOffsetY;
        }
      }

      if (effect.alpha !== undefined) fgCtx.globalAlpha = effect.alpha;

      let w = (img.width || 100) * finalScaleX;
      let h = (img.height || 100) * finalScaleY;

      const isFullScreenEffect = effect.fullScreen || (effect.imageUrl && effect.imageUrl.toLowerCase().includes("telacheia"));

      if (isFullScreenEffect) {
        fgCtx.setTransform(dpr, 0, 0, dpr, (fgCtx.canvas.width / 2), (fgCtx.canvas.height / 2));
        w = fgCtx.canvas.width / dpr;
        h = fgCtx.canvas.height / dpr;
      } else {
        fgCtx.translate(effect.x + finalOffsetX, effect.y + finalOffsetY);
      }

      if (!effect.facingRight) fgCtx.scale(-1, 1);
      if (effect.rotation !== undefined) fgCtx.rotate((effect.rotation * Math.PI) / 180);

      const dx = -w / 2;
      const isCentered = isFullScreenEffect || effect.type === "CHARGING_PEDRA" || effect.type?.includes("COMBO") || (effect.imageUrl && effect.imageUrl.includes("impacto"));
      const dy = isCentered ? -h / 2 : -h;

      const config = effect.configKey ? effMgr.getEffect(effect.configKey) : null;
      const tintColor = config?.color || "#ffffff";
      
      if (tintColor !== "#ffffff") {
         const cacheKey = `eff_${effect.configKey || effect.imageUrl}_${effect.animFrame}`;
         const tintedImg = animMgr.getTintedImg(img, tintColor, cacheKey, img.width, img.height);
         fgCtx.drawImage(tintedImg as any, dx, dy, w, h);
      } else {
         fgCtx.drawImage(img as any, dx, dy, w, h);
      }

      fgCtx.restore();
    }

    const allPlayers = [...this.engine.p1Team, ...this.engine.p2Team].filter(
      Boolean,
    ) as Player[];

    // Draw Ground Shadows
    allPlayers.forEach((p) => {
      if (p.state === PlayerState.STANDBY) return;

      const groundY = WORLD_HEIGHT - this.engine.groundY;

      // Draw Broken Ground (Chão Quebrado) when charging Ki
      if (p.brokenGroundAlpha > 0) {
        const stageKey = this.engine.currentStageData?.groundDestroyedConfigKey || "";
        const stageConfig = stageKey ? EffectConfigKeyManager.getInstance().getEffect(stageKey) : null;
        const crackUrl = stageConfig?.imageUrl || "/Assets/efeitos/chao/destruido/1.gif";
        const gifFramesCount =
          this.engine.animationManager.getGifFrameCount(crackUrl);
        if (gifFramesCount > 0) {
          fgCtx.save();
          fgCtx.globalAlpha = p.brokenGroundAlpha;

          // Apply stage config filters if present
          if (stageConfig) {
            let filters = "";
            if (stageConfig.effectHueRotate) filters += ` hue-rotate(${stageConfig.effectHueRotate}deg)`;
            if (stageConfig.effectSaturate !== undefined) filters += ` saturate(${stageConfig.effectSaturate})`;
            if (stageConfig.effectBrightness !== undefined) filters += ` brightness(${stageConfig.effectBrightness})`;
            if (stageConfig.effectContrast !== undefined) filters += ` contrast(${stageConfig.effectContrast})`;
            
            if (filters) fgCtx.filter = filters.trim();
          }

          // Draw centered at brokenGroundX
          fgCtx.translate(p.brokenGroundX, p.brokenGroundY || groundY);

          const frameIdx = 11;

          const img = this.engine.animationManager.getGifFrame(
            crackUrl,
            frameIdx,
          );
          if (img) {
            const scale = 1.5;
            const w = (img.width || 100) * scale;
            const h = (img.height || 100) * scale;
            const dx = -w / 2;
            const dy = -h / 2;
            
            // Apply tint if configured
            const tintColor = stageConfig?.color || "#ffffff";
            if (tintColor !== "#ffffff") {
              const cacheKey = `crack_ki_${stageKey || crackUrl}_${frameIdx}`;
              const tintedImg = this.engine.animationManager.getTintedImg(img, tintColor, cacheKey, img.width, img.height);
              fgCtx.drawImage(tintedImg as any, dx, dy, w, h);
            } else {
              fgCtx.drawImage(img as any, dx, dy, w, h);
            }
          }
          fgCtx.restore();
        } else {
          this.engine.animationManager.loadGif(crackUrl);
        }
      }

      // Draw Genkidama Ground Cracks (Chão Quebrado da Genkidama) with scale 3.5
      const allCracks: { x: number; alpha: number; scale: number; maxLife: number; life: number }[] = [];
      if (p.genkidamaCracks && p.genkidamaCracks.length > 0) {
        allCracks.push(...p.genkidamaCracks);
      }
      this.engine.projectiles.forEach((proj) => {
        if (proj instanceof Genkidama && proj.genkidamaCracks && proj.genkidamaCracks.length > 0) {
          allCracks.push(...proj.genkidamaCracks);
        }
      });

      if (allCracks.length > 0) {
        const stageKey = this.engine.currentStageData?.groundDestroyedConfigKey || "";
        const stageConfig = stageKey ? EffectConfigKeyManager.getInstance().getEffect(stageKey) : null;
        const crackUrl = stageConfig?.imageUrl || "/Assets/efeitos/chao/destruido/1.gif";

        allCracks.forEach((crack) => {
          const gifFramesCount =
            this.engine.animationManager.getGifFrameCount(crackUrl);
          if (gifFramesCount > 0) {
            fgCtx.save();
            fgCtx.globalAlpha = crack.alpha;

            // Apply stage config filters if present
            if (stageConfig) {
              let filters = "";
              if (stageConfig.effectHueRotate) filters += ` hue-rotate(${stageConfig.effectHueRotate}deg)`;
              if (stageConfig.effectSaturate !== undefined) filters += ` saturate(${stageConfig.effectSaturate})`;
              if (stageConfig.effectBrightness !== undefined) filters += ` brightness(${stageConfig.effectBrightness})`;
              if (stageConfig.effectContrast !== undefined) filters += ` contrast(${stageConfig.effectContrast})`;
              
              if (filters) fgCtx.filter = filters.trim();
            }

            fgCtx.translate(crack.x, groundY);

            const age = crack.maxLife - crack.life;
            const frameIdx = Math.min(11, Math.floor(age / 3));

            const img = this.engine.animationManager.getGifFrame(
              crackUrl,
              frameIdx,
            );
            if (img) {
              const scale = crack.scale;
              const w = (img.width || 100) * scale;
              const h = (img.height || 100) * scale;
              const dx = -w / 2;
              const dy = -h / 2;
              
              // Apply tint if configured
              const tintColor = stageConfig?.color || "#ffffff";
              if (tintColor !== "#ffffff") {
                const cacheKey = `crack_genki_${stageKey || crackUrl}_${frameIdx}`;
                const tintedImg = this.engine.animationManager.getTintedImg(img, tintColor, cacheKey, img.width, img.height);
                fgCtx.drawImage(tintedImg as any, dx, dy, w, h);
              } else {
                fgCtx.drawImage(img as any, dx, dy, w, h);
              }
            }
            fgCtx.restore();
          } else {
            this.engine.animationManager.loadGif(crackUrl);
          }
        });
      }

      fgCtx.save();

      const distanceToGround = groundY - p.pos.y;

      // Scale and opacity based on height
      const shadowScaleX = 1;
      const shadowScaleY = -Math.max(0.15, 0.3 - distanceToGround * 0.0005);
      const shadowOpacity = Math.max(0, 0.4 - distanceToGround * 0.001);

      if (shadowOpacity > 0) {
        fgCtx.globalAlpha = shadowOpacity;

        const groundCenterX = p.x + p.width / 2;

        fgCtx.translate(groundCenterX, groundY);
        fgCtx.scale(shadowScaleX, shadowScaleY);

        // Project shadow direction (shear). Slight tilt towards the front.
        const shear = p.facingRight ? -0.4 : 0.4;
        fgCtx.transform(1, 0, shear, 1, 0, 0);

        if (p.rotation) {
          fgCtx.translate(0, -p.height / 2);
          const shadowRotation = p.facingRight ? p.rotation : -p.rotation;
          fgCtx.rotate((shadowRotation * Math.PI) / 180);
          fgCtx.translate(0, p.height / 2);
        }

        this.engine.animationManager.drawPlayer(
          fgCtx,
          p.data,
          p.state,
          -p.width / 2, // Center the bottom of the character at 0,0
          -p.height,
          p.width,
          p.height,
          p.facingRight,
          p.animFrame,
          p.stunTimer > 0,
          p.comboType as any,
          p.comboStep,
          p.ataque,
          p.ultPhase,
          p.nextTransformId,
          p.attackTimer,
          p.ultType,
          true, // isGrounded does not affect shadow visual directly (unless animation changes)
          p.isDetransforming,
          true, // isShadow = true
          p.isKOTag,
          false, // sparkingActive
          false, // superDashActive
          undefined, // auraH
          undefined, // auraW
          p.wasCrouching,
          p.stunTimer,
          p.animFinished,
          (p as any).customSubphase,
          undefined,
          p.lastState
        );
      }

      fgCtx.restore();
    });

    // Draw Afterimages
    this.engine.afterimages.forEach((img) => {
      fgCtx.save();
      fgCtx.globalAlpha = img.opacity;

      if ((img as any).rotation) {
        const cx = img.x + img.width / 2;
        const cy = img.y + img.height / 2;
        fgCtx.translate(cx, cy);
        const imgRotation = img.facingRight ? (img as any).rotation : -(img as any).rotation;
        fgCtx.rotate((imgRotation * Math.PI) / 180);
        fgCtx.translate(-cx, -cy);
      }

      this.engine.animationManager.drawPlayer(
        fgCtx,
        img.data,
        img.state,
        img.x,
        img.y,
        img.width,
        img.height,
        img.facingRight,
        img.animFrame,
        img.stunTimer,
        img.comboType,
        img.comboStep,
        img.ataque,
        img.ultPhase,
        img.nextTransformId,
        img.attackTimer,
        img.ultType,
        img.isGrounded,
        img.isDetransforming,
        false, // isShadow
        img.isKOTag,
        false, // sparkingActive
        false, // superDashActive
        undefined, // auraH
        undefined, // auraW
        false, // wasCrouching
        0, // stunTimer
        (img as any).animFinished || false,
        (img as any).customSubphase,
        undefined,
        (img as any).lastState
      );
      fgCtx.restore();
    });

    // Draw ALL projectiles behind characters
    for (const p of this.engine.projectiles) {
      this.drawProjectile(fgCtx, p);
    }

    // Draw Cinematic Impact Effects (Behind characters, in front of Beams)
    for (let i = 0; i < backEffects.length; i++) {
      const effect = backEffects[i];
      const img = this.engine.animationManager.getGifFrame(effect.imageUrl, effect.animFrame);
      if (img) {
        fgCtx.save();
        if (effect.alpha !== undefined) fgCtx.globalAlpha = effect.alpha;

        let tintColor = "#ffffff";
        if (effect.configKey) {
          const config = effMgr.getEffect(effect.configKey);
          if (config) {
            let filters = "";
            if (config.effectHueRotate) filters += ` hue-rotate(${config.effectHueRotate}deg)`;
            if (config.effectSaturate !== undefined) filters += ` saturate(${config.effectSaturate})`;
            if (config.effectBrightness !== undefined) filters += ` brightness(${config.effectBrightness})`;
            if (config.effectContrast !== undefined) filters += ` contrast(${config.effectContrast})`;
            
            if (filters) fgCtx.filter = filters.trim();
            if (config.effectOpacity !== undefined) fgCtx.globalAlpha = config.effectOpacity;
            if (config.color) tintColor = config.color;
          }
        }

        let w = (img.width || 100) * effect.scale;
        let h = (img.height || 100) * effect.scale;

        const isFullScreen = 
          effect.fullScreen ||
          (effect.imageUrl && effect.imageUrl.toLowerCase().includes("telacheia")) || 
          (effect.configKey && effect.configKey.toLowerCase().includes("telacheia"));

        if (isFullScreen) {
          fgCtx.setTransform(1, 0, 0, 1, 0, 0);
          fgCtx.scale(dpr, dpr);
          const canvasLogicalW = fgCtx.canvas.width / dpr;
          const canvasLogicalH = fgCtx.canvas.height / dpr;
          fgCtx.translate(canvasLogicalW / 2, canvasLogicalH / 2);
          w = canvasLogicalW;
          h = canvasLogicalH;
        } else {
          fgCtx.translate(effect.x, effect.y);
        }
        
        if (!effect.facingRight) fgCtx.scale(-1, 1);
        if (effect.rotation !== undefined) fgCtx.rotate((effect.rotation * Math.PI) / 180);

        if (tintColor !== "#ffffff") {
           const cacheKey = `eff_fg_${effect.configKey || effect.imageUrl}_${effect.animFrame}`;
           const tintedImg = this.engine.animationManager.getTintedImg(img, tintColor, cacheKey, img.width, img.height);
           fgCtx.drawImage(tintedImg as any, -w / 2, -h / 2, w, h);
        } else {
           fgCtx.drawImage(img as any, -w / 2, -h / 2, w, h);
        }
        fgCtx.restore();
      }
    }

    if (this.engine.isBeamClashActive) {
      const p1Beam = this.engine.projectiles.find(p => p.ownerId === "p1" && p.isBeam && p.active && !p.isShrinking);
      const p2Beam = this.engine.projectiles.find(p => p.ownerId === "p2" && p.isBeam && p.active && !p.isShrinking);
      
      let cx = (this.engine as any).beamClashVisualX;
      let cy = (p1.y + p2.y) / 2;
      
      if (p1Beam && p2Beam) {
        const tip1X = (p1Beam.initialFacingRight ?? p1Beam.vx > 0) ? p1Beam.x + p1Beam.width : p1Beam.x;
        const tip2X = (p2Beam.initialFacingRight ?? p2Beam.vx > 0) ? p2Beam.x + p2Beam.width : p2Beam.x;
        cx = (tip1X + tip2X) / 2;
        cy = (p1Beam.y + p2Beam.y) / 2;
      } else if (cx === undefined) {
        cx = (p1.x + p2.x) / 2;
      }
      
      this.drawBeamClashWaves(fgCtx, cx, cy);
    }

    // Draw ALL player auras first so they are behind all character sprites
    allPlayers.forEach((p) => {
      if (p.state === PlayerState.STANDBY) return;

      fgCtx.save();

      if (p.state === PlayerState.VANISH) {
        fgCtx.globalAlpha = 0.25;
      }

      if (this.engine.introPhase === IntroPhase.P1_INTRO && p === p2) {
        fgCtx.globalAlpha = 0;
      } else if (this.engine.introPhase === IntroPhase.P2_INTRO && p === p1) {
        fgCtx.globalAlpha = 0;
      }

      const opp = p === p1 ? p2 : p1;
      if (
        opp &&
        (opp.state === PlayerState.TRANSFORM ||
          opp.state === PlayerState.DETRANSFORM ||
          opp.state === PlayerState.FUSION ||
          opp.state === PlayerState.DEFUSION)
      ) {
        fgCtx.globalAlpha = 0;
      }

      if (
        ((p1.state === PlayerState.TRANSFORM ||
          p1.state === PlayerState.DETRANSFORM ||
          p1.state === PlayerState.FUSION ||
          p1.state === PlayerState.DEFUSION) &&
          p !== p1) ||
        ((p2.state === PlayerState.TRANSFORM ||
          p2.state === PlayerState.DETRANSFORM ||
          p2.state === PlayerState.FUSION ||
          p2.state === PlayerState.DEFUSION) &&
          p !== p2)
      ) {
        fgCtx.globalAlpha = 0;
      }

      if (p.rotation) {
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        fgCtx.translate(cx, cy);
        const auraRotation = p.facingRight ? p.rotation : -p.rotation;
        fgCtx.rotate((auraRotation * Math.PI) / 180);
        fgCtx.translate(-cx, -cy);
      }

      this.engine.animationManager.drawPlayerAura(
        fgCtx,
        p.data,
        p.state,
        p.x,
        p.y,
        p.width,
        p.height,
        p.facingRight,
        p.sparkingTimer > 0,
        p.auraHeightScale,
        p.auraWidthScale,
      );

      fgCtx.restore();
    });

    // Draw Characters (Visual Instance)
    allPlayers.forEach((p) => {
      if (p.state !== PlayerState.STANDBY && p !== p1 && p !== p2) {
        fgCtx.save();
        if (
          ((p1.state === PlayerState.TRANSFORM ||
            p1.state === PlayerState.DETRANSFORM ||
            p1.state === PlayerState.FUSION ||
            p1.state === PlayerState.DEFUSION) &&
            p !== p1) ||
          ((p2.state === PlayerState.TRANSFORM ||
            p2.state === PlayerState.DETRANSFORM ||
            p2.state === PlayerState.FUSION ||
            p2.state === PlayerState.DEFUSION) &&
            p !== p2)
        ) {
          fgCtx.globalAlpha = 0;
        }

        if (p.rotation) {
          const cx = p.x + p.width / 2;
          const cy = p.y + p.height / 2;
          fgCtx.translate(cx, cy);
          const instRotation = p.facingRight ? p.rotation : -p.rotation;
          fgCtx.rotate((instRotation * Math.PI) / 180);
          fgCtx.translate(-cx, -cy);
        }

        this.engine.animationManager.drawPlayer(
          fgCtx,
          p.data,
          p.state,
          p.x,
          p.y,
          p.width,
          p.height,
          p.facingRight,
          p.animFrame,
          p.stunTimer > 0,
          p.comboType as any,
          p.comboStep,
          p.ataque,
          p.ultPhase,
          p.nextTransformId,
          p.attackTimer,
          p.ultType,
          p.isGrounded,
          p.isDetransforming,
          false,
          p.isKOTag,
          p.sparkingTimer > 0,
          p.superDashActive,
          p.auraHeightScale,
          p.auraWidthScale,
          p.wasCrouching,
          p.stunTimer,
          p.animFinished,
          (p as any).customSubphase,
          undefined,
          p.lastState
        );
        fgCtx.restore();
      }
    });

    [p2, p1].forEach((p) => {
      fgCtx.save();

      // --- DRAW SCENE OBJECTS FROM ANIMATION --- (Removed debug drawing)
      if (p.lastAnimKey) {
        // We used to draw debug rects for scene objects here, but it looks bad in production.
      }

      // Custom Ultimate Projectiles
      if (p.data.id === "gogeta_blue" && p["purificadorActive"]) {
        const panim = p.data.spriteConfig?.animations["ULTIMATE_2_PURIFICADOR"];
        if (panim) {
          this.engine.animationManager.drawFrame(
            fgCtx,
            panim,
            Math.floor(p.ultTimer / 3),
            p.x,
            p.y,
            p.width,
            p.height,
            panim.scale || 2.2,
            p.facingRight,
          );
        }
      }

      // Custom Ultimate Beams
      const currentAnimKeyForBeam = p.lastAnimKey || p.state;
      const currentAnimConfigForBeam =
        p.data.spriteConfig?.animations?.[currentAnimKeyForBeam];

      if (
        p.state === PlayerState.ULTIMATE ||
        p.state === PlayerState.ULTIMATE_2
      ) {
        let familyId = currentAnimConfigForBeam?.createsBeam;

        if (p.data.id === "teen_gohan_ssj2" || p.data.id === "kuririn") {
          familyId = undefined;
        }

        // Se já houver um projétil de beam físico ativo no motor para este jogador,
        // não desenhamos o beam cosmético on-the-fly para evitar duplicidade!
        if (familyId) {
          const ownerId = (p === this.engine.player1 || this.engine.p1Team.includes(p)) ? "p1" : "p2";
          const hasActiveBeamProjectile = this.engine.projectiles.some(
            proj => proj.active && proj.ownerId === ownerId && proj.isBeam && proj.beamFamilyId === familyId
          );
          if (hasActiveBeamProjectile) {
            familyId = undefined;
          }
        }

        if (
          familyId &&
          (familyId.includes("GENKIDAMA") ||
            familyId.includes("HAKAI") ||
            familyId.includes("ESFERA_DA_MORTE"))
        ) {
          familyId = undefined;
        }

        if (!familyId) {
          if (
            (p.data.id === "goku_ssj" &&
              p.ultType === 2 &&
              (p.ultPhase === 7 || (p.ultPhase === 8 && p.ultTimer < 10))) ||
            (p.data.id === "vegeta_base" &&
              p.ultType === 2 &&
              (p.ultPhase === 4 || (p.ultPhase === 5 && p.ultTimer < 10)))
          ) {
            if (p.data.id === "vegeta_base") {
              familyId = "BEAM_2";
            } else if (p.data.id === "goku_ssj") {
              familyId = "BEAM_SSJ";
            } else {
              familyId = "BEAM";
            }
          }
        }

        if (familyId) {
          const family =
            BeamConfigKeyManager.getInstance().getBeamConfig(familyId);
          const startAnim = family?.start;
          const midAnim = family?.middle;
          const endAnim = family?.end;

          if (midAnim) {
            const midImg = this.engine.animationManager.getGifFrame(
              midAnim.imageUrl,
              p.animFrame,
            );

            fgCtx.save();
            fgCtx.globalCompositeOperation = "source-over";
            // Removed shadowBlur to improve FPS performance

            let animKey = resolveAnimationKey(
              p.data.id,
              p.state,
              p.comboType,
              p.comboStep,
              p.ataque,
              p.ultPhase,
              p.nextTransformId,
              p.attackTimer,
              p.ultType,
              p.isGrounded,
              p.isDetransforming,
              p.isKOTag,
              p.data.spriteConfig,
              p.wasCrouching,
              p.stunTimer,
              p.superDashPhase,
              p.animFinished,
              (p as any).customSubphase,
              p.currentPhaseAnim
            );
            const animConfig = p.data.spriteConfig?.animations?.[animKey];
            const kiOriginX =
              startAnim?.kiOriginX !== undefined
                ? startAnim.kiOriginX
                : midAnim?.kiOriginX !== undefined
                  ? midAnim.kiOriginX
                  : animConfig?.kiOriginX !== undefined
                    ? animConfig.kiOriginX
                    : p.data.spriteConfig?.kiOriginX || 76;
            const kiOriginY =
              startAnim?.kiOriginY !== undefined
                ? startAnim.kiOriginY
                : midAnim?.kiOriginY !== undefined
                  ? midAnim.kiOriginY
                  : animConfig?.kiOriginY !== undefined
                    ? animConfig.kiOriginY
                    : p.data.spriteConfig?.kiOriginY || 125;

            let startX = p.facingRight
              ? p.x + kiOriginX
              : p.x + p.width - kiOriginX;
            let startY = p.y + kiOriginY - 40;

            // Draw Start
            if (startAnim) {
              const startW = (startAnim.frameWidth || 80) * (startAnim.scale || 2.2);
              this.engine.animationManager.drawFrame(
                fgCtx,
                startAnim,
                p.animFrame,
                startX,
                startY + 5,
                startW,
                80,
                startAnim.scale || 2.2,
                p.facingRight,
                true,
              );
            }

            // Draw Middle Loop
            if (midImg) {
              const h = midImg.height || midAnim.frameHeight || 100;
              const scale = midAnim.scale || 2.2;
              const startScale = startAnim?.scale || scale;
              const startW = startAnim
                ? (startAnim.frameWidth || 80) * startScale
                : 80 * scale;

              let midLeft = 0;
              if (startAnim) {
                const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
                const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
                midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
              }

              const midOffsetY = midAnim.offsetY || 0;

              fgCtx.save();
              if (!p.facingRight) {
                fgCtx.translate(startX, startY);
                fgCtx.scale(-1, 1);
              } else {
                fgCtx.translate(startX, startY);
              }

              fgCtx.translate(0, midOffsetY);

              // Always draw middle segments sequentially (Z-Index/layer order incremented back-to-front in growth direction)
              const beamWidth = Math.max(0, this.engine.worldWidth - midLeft) / scale;
              fgCtx.translate(midLeft, (-h * scale) / 2 + 5);
              fgCtx.scale(scale, scale);

              const segmentWidth = midImg.width || midAnim.frameWidth || h;
              const spacing = typeof midAnim.beamSpacing === "number" ? midAnim.beamSpacing : 0;
              const totalSegmentWidth = Math.max(
                1,
                segmentWidth + spacing,
              );
              const numRepeats = Math.ceil(beamWidth / totalSegmentWidth) + 1;
              const moveX = 0;

              // Ultra-optimized, clip-free math-based rendering of segmented textures
              // Rendered sequentially so that each new segment has an incremented rendering layer (Z-Index/above previous)
              for (let i = 0; i <= numRepeats; i++) {
                let dx = i * totalSegmentWidth - moveX;
                let dw = segmentWidth;
                let sx = 0;
                let sw = segmentWidth;

                if (dx < 0) {
                  const overlap = -dx;
                  sx += overlap;
                  sw -= overlap;
                  dx = 0;
                  dw -= overlap;
                }

                if (dx + dw > beamWidth) {
                  const overlap = dx + dw - beamWidth;
                  sw -= overlap;
                  dw -= overlap;
                }

                if (dw > 0 && sw > 0) {
                  fgCtx.drawImage(
                    midImg as CanvasImageSource,
                    sx,
                    0,
                    sw,
                    h,
                    dx,
                    0,
                    dw,
                    h,
                  );
                }
              }
              fgCtx.restore();
            }

            // Draw End
            if (endAnim) {
              const scale = midAnim.scale || 2.2;
              const startScale = startAnim?.scale || scale;
              const startW = startAnim
                ? (startAnim.frameWidth || 80) * startScale
                : 80 * scale;

              let midLeft = 0;
              if (startAnim) {
                const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
                const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
                midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
              }

              this.engine.animationManager.drawFrame(
                fgCtx,
                endAnim,
                p.animFrame,
                p.facingRight
                  ? startX + midLeft + this.engine.worldWidth
                  : startX - (midLeft + this.engine.worldWidth),
                startY + 5,
                0,
                10,
                endAnim.scale || midAnim?.scale || 2.2,
                p.facingRight,
                true,
              );
            }

            fgCtx.restore();
          }
        }
      }

      fgCtx.restore();
    });

    // Draw active players with correct depth ordering (z-ordering)
    let drawPlayers = [p2, p1];
    
    // MUI Dodge layering: 0-3 front, >=4 back (matches "starting at frame 5" if 1-indexed)
    const p1IsMuiDodge = p1.data.id === "goku_mui" && p1.state === PlayerState.MUI_DODGE;
    const p2IsMuiDodge = p2.data.id === "goku_mui" && p2.state === PlayerState.MUI_DODGE;

    if (p1.state === PlayerState.ULTIMATE && p1.ultPhase === 4) {
      drawPlayers = [p2, p1]; // Draw p2 (opponent) first (behind), p1 (attacker) second (on top)
    } else if (p2.state === PlayerState.ULTIMATE && p2.ultPhase === 4) {
      drawPlayers = [p1, p2]; // Draw p1 (opponent) first (behind), p2 (attacker) second (on top)
    } else if (p1IsMuiDodge) {
      if (p1.animFrame < 4) {
        drawPlayers = [p2, p1]; // P2 behind, P1 (MUI) in front
      } else {
        drawPlayers = [p1, p2]; // P1 (MUI) behind, P2 in front
      }
    } else if (p2IsMuiDodge) {
      if (p2.animFrame < 4) {
        drawPlayers = [p1, p2]; // P1 behind, P2 (MUI) in front
      } else {
        drawPlayers = [p2, p1]; // P2 (MUI) behind, P1 in front
      }
    } else {
      drawPlayers = [p2, p1].sort((a, b) => (a.y + a.height) - (b.y + b.height));
    }

    drawPlayers.forEach((p) => {
      fgCtx.save();
      if (p.state === PlayerState.VANISH) {
        // Make character barely visible during vanish frames
        fgCtx.globalAlpha = 0.2;
      }

      if (this.engine.introPhase === IntroPhase.P1_INTRO && p === p2) {
        fgCtx.globalAlpha = 0;
      } else if (this.engine.introPhase === IntroPhase.P2_INTRO && p === p1) {
        fgCtx.globalAlpha = 0;
      }

      const opp = p === p1 ? p2 : p1;
      if (
        opp.state === PlayerState.TRANSFORM ||
        opp.state === PlayerState.DETRANSFORM ||
        opp.state === PlayerState.FUSION ||
        opp.state === PlayerState.DEFUSION
      ) {
        fgCtx.globalAlpha = 0;
      }

      if (p.rotation) {
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        fgCtx.translate(cx, cy);
        const pRotation = p.facingRight ? p.rotation : -p.rotation;
        fgCtx.rotate((pRotation * Math.PI) / 180);
        fgCtx.translate(-cx, -cy);
      }

      this.engine.animationManager.drawPlayer(
        fgCtx,
        p.data,
        p.state,
        p.x,
        p.y,
        p.width,
        p.height,
        p.facingRight,
        p.animFrame,
        p.stunTimer > 0,
        p.comboType as any,
        p.comboStep,
        p.ataque,
        p.ultPhase,
        p.nextTransformId,
        p.attackTimer,
        p.ultType,
        p.isGrounded,
        p.isDetransforming,
        false,
        p.isKOTag,
        p.sparkingTimer > 0,
        p.superDashActive,
        p.auraHeightScale,
        p.auraWidthScale,
        p.wasCrouching,
        p.stunTimer,
        p.animFinished,
        (p as any).customSubphase,
        p.currentPhaseAnim || undefined,
        p.lastState
      );

      fgCtx.restore();
    });

    // Draw foreground visual effects (e.g., FULL_SCREEN_DUST)
    for (let i = 0; i < frontEffects.length; i++) {
      const effect = frontEffects[i];
      const img = this.engine.animationManager.getGifFrame(
        effect.imageUrl,
        effect.animFrame,
      );
      if (img) {
        fgCtx.save();

        let finalScaleX = effect.scale;
        let finalScaleY = effect.scale;
        let finalOffsetX = 0;
        let finalOffsetY = 0;

        // --- APPLY EFFECT CONFIG KEY MANAGER STYLES ---
        const config = effect.configKey ? effMgr.getEffect(effect.configKey) : null;
        let filters: any = null;

        if (config) {
          if (config.effectHueRotate || config.effectSaturate !== undefined || config.effectBrightness !== undefined || config.effectContrast !== undefined) {
            filters = {
              hueRotate: config.effectHueRotate,
              saturate: config.effectSaturate,
              brightness: config.effectBrightness,
              contrast: config.effectContrast
            };
          }

          if (config.effectOpacity !== undefined) fgCtx.globalAlpha = config.effectOpacity;
          if (config.effectScaleX !== undefined) finalScaleX *= config.effectScaleX;
          if (config.effectScaleY !== undefined) finalScaleY *= config.effectScaleY;
          if (config.effectOffsetX !== undefined) finalOffsetX = config.effectOffsetX;
          if (config.effectOffsetY !== undefined) finalOffsetY = config.effectOffsetY;
        }

        // Apply custom alpha if provided (overrides configKey if set)
        if (effect.alpha !== undefined) {
          fgCtx.globalAlpha = effect.alpha;
        }

        const tintColor = config?.color || "#ffffff";
        let drawImg: any = img;

        if (tintColor !== "#ffffff" || filters) {
           const cacheKey = `eff_fg_${effect.configKey || effect.imageUrl}_${effect.animFrame}`;
           drawImg = this.engine.animationManager.getCachedEffectImg(img, tintColor, cacheKey, filters, (img as any).width, (img as any).height);
        }

        let w = (drawImg.width || 100) * finalScaleX;
        let h = (drawImg.height || 100) * finalScaleY;

        const isFullScreenEffect = 
          effect.fullScreen ||
          effect.type === "FULL_SCREEN_DUST" || 
          (effect.imageUrl && effect.imageUrl.toLowerCase().includes("telacheia")) ||
          (effect.configKey && effect.configKey.toLowerCase().includes("telacheia"));

        if (isFullScreenEffect) {
          fgCtx.setTransform(1, 0, 0, 1, 0, 0);
          fgCtx.scale(dpr, dpr);
          
          const canvasLogicalW = fgCtx.canvas.width / dpr;
          const canvasLogicalH = fgCtx.canvas.height / dpr;
          
          fgCtx.translate(canvasLogicalW / 2, canvasLogicalH / 2);
          w = canvasLogicalW;
          h = canvasLogicalH;
        } else {
          fgCtx.translate(effect.x + finalOffsetX, effect.y + finalOffsetY);
        }

        if (!effect.facingRight) fgCtx.scale(-1, 1);

        // Apply custom rotation if provided
        if (effect.rotation !== undefined) {
          fgCtx.rotate((effect.rotation * Math.PI) / 180);
        }

        // For rocks and combat hit effects, draw centered. Otherwise draw bottom-anchored.
        const isCentered =
          isFullScreenEffect ||
          effect.type === "FULL_SCREEN_DUST" ||
          effect.type === "CHARGING_PEDRA" ||
          effect.type === "COMBO_HIT" ||
          effect.type === "COMBO_HIT_HEAVY" ||
          effect.type === "DRAGON_RUSH_START_EFFECT" ||
          effect.type === "KAME_GENKI_COLLISION" ||
          (effect.type && effect.type.includes("COMBO")) ||
          (effect.imageUrl &&
            (effect.imageUrl.includes("efeitos/impacto") ||
              effect.imageUrl.includes("COMBO")));
        const dx = -w / 2;
        const dy = isCentered ? -h / 2 : -h;

        fgCtx.drawImage(drawImg as any, dx, dy, w, h);

        const isRockOrGroundDestruction =
          effect.type === "GROUND_DESTROYED" ||
          effect.type === "CHARGING_PEDRA" ||
          (typeof effect.type === "string" &&
            (effect.type.includes("PEDRA") ||
              effect.type.includes("ROCK") ||
              effect.type.includes("GROUND") ||
              effect.type.includes("CHÃO") ||
              effect.type.includes("DESTRUIDO") ||
              effect.type.includes("CRACK"))) ||
          (typeof effect.imageUrl === "string" &&
            (effect.imageUrl.includes("PEDRA") ||
              effect.imageUrl.includes("ROCK") ||
              effect.imageUrl.includes("chao/destruido") ||
              effect.imageUrl.includes("CHÃO") ||
              effect.imageUrl.includes("DRESTRUIDO") ||
              effect.imageUrl.includes("DESTRUIDO")));

        let skipStageOverlay = false;
        if (effect.configKey) {
          const config = effMgr.getEffect(effect.configKey);
          if (config && (
            (config.effectHueRotate !== undefined && config.effectHueRotate !== 0) ||
            (config.effectSaturate !== undefined && config.effectSaturate !== 1) ||
            (config.effectBrightness !== undefined && config.effectBrightness !== 1) ||
            (config.effectContrast !== undefined && config.effectContrast !== 1) ||
            (config.color && config.color !== "#ffffff")
          )) {
            skipStageOverlay = true;
          }
        }

        if (isRockOrGroundDestruction && !skipStageOverlay) {
          fgCtx.save();
          fgCtx.globalCompositeOperation = "source-atop";
          fgCtx.fillStyle = getStageGroundColor(this.engine.stageTheme);
          // Keeps textures and edge highlights crisp rather than solid flat rectangles
          fgCtx.globalAlpha = 0.45;
          fgCtx.fillRect(dx, dy, w, h);
          fgCtx.restore();
        }

        fgCtx.restore();
      }
    }

    // Debug: Draw Hitboxes (Hitbox Component)
    if (this.engine.trainingShowHitboxes) {
      fgCtx.save();
      fgCtx.lineWidth = 2;

      // Draw all active players on the screen (including assist characters on the screen)
      const activeScreenPlayers = [...this.engine.p1Team, ...this.engine.p2Team].filter(
        (p) => p && p.state !== PlayerState.STANDBY
      ) as Player[];

      activeScreenPlayers.forEach((p) => {
        const h = p.hitbox;
        // Hitbox de receber dano (hurtbox): Verde para P1, Azul para P2
        fgCtx.strokeStyle = p.data.id === this.engine.player1.data.id || this.engine.p1Team.includes(p) 
          ? "rgba(34, 197, 94, 0.85)" // Verde vivo para P1 (Hurtbox)
          : "rgba(56, 189, 248, 0.85)"; // Azul claro para P2 (Hurtbox)
        fgCtx.fillStyle = p.data.id === this.engine.player1.data.id || this.engine.p1Team.includes(p) 
          ? "rgba(34, 197, 94, 0.08)" 
          : "rgba(56, 189, 248, 0.08)";
        fgCtx.fillRect(h.x, h.y, h.width, h.height);
        // fgCtx.strokeRect(h.x, h.y, h.width, h.height);

        // Draw Anchor Point
        fgCtx.fillStyle = "#ff0000";
        fgCtx.fillRect(p.pos.x - 2, p.pos.y - 2, 4, 4);

        // Draw Circular Hitbox if Kuririn is in Phase 3 Ultimate
        if (p.data.id === "kuririn" && p.ultType === 1 && p.ultPhase === 3) {
          const currentRadius = (426 * 2.2) / 2;

          const pCenterX = p.pos.x + p.width / 2;
          const pCenterY = p.pos.y + p.height / 2;

          fgCtx.strokeStyle = "rgba(255, 165, 0, 0.8)"; // Orange for ultimate area
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, currentRadius, 0, Math.PI * 2);
          // fgCtx.stroke();
        }

        // Draw Gohan Teen Special 3 Phase 2 (comboStep === 1) circular hitbox
        if (p.data.id === "teen_gohan_ssj2" && p.comboType === "SPECIAL_3" && p.comboStep === 1) {
          const currentRadius = Math.max(p.width, p.height) * 0.8;
          const pCenterX = p.hitbox.x + p.hitbox.width / 2;
          const pCenterY = p.hitbox.y + p.hitbox.height / 2;

          // Translucent purple fill
          fgCtx.fillStyle = "rgba(168, 85, 247, 0.15)";
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, currentRadius, 0, Math.PI * 2);
          fgCtx.fill();

          // Stroke
          fgCtx.strokeStyle = "rgba(168, 85, 247, 0.75)";
          fgCtx.lineWidth = 3;
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, currentRadius, 0, Math.PI * 2);
          // fgCtx.stroke();
        }

          if (p.data.id === "teen_gohan_ssj2" && p.comboType === "SPECIAL_4") {
            const pCenterX = p.hitbox.x + p.hitbox.width / 2;
            const pCenterY = p.hitbox.y + p.hitbox.height / 2;

            if (p.comboStep === 0) {
              const hitBoxWidth = 140;
              const hitBoxHeight = 100;
              const hitBoxX = p.facingRight ? pCenterX : pCenterX - hitBoxWidth;
              const hitBoxY = pCenterY - hitBoxHeight / 2;

              fgCtx.fillStyle = "rgba(249, 115, 22, 0.15)"; // Orange
              fgCtx.fillRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
              // fgCtx.strokeStyle = "rgba(249, 115, 22, 0.75)";
              // fgCtx.lineWidth = 2;
              // fgCtx.strokeRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
            } else if (p.comboStep === 1) {
              const hitBoxWidth = 160;
              const hitBoxHeight = 110;
              const hitBoxX = p.facingRight ? pCenterX : pCenterX - hitBoxWidth;
              const hitBoxY = pCenterY - hitBoxHeight / 2;

              fgCtx.fillStyle = "rgba(239, 68, 68, 0.15)"; // Red
              fgCtx.fillRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
              // fgCtx.strokeStyle = "rgba(239, 68, 68, 0.75)";
              // fgCtx.lineWidth = 2;
              // fgCtx.strokeRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
            }
          }

          if (p.data.id === "gogeta_ssj4" && p.comboType === "SPECIAL_2") {
            const pCenterX = p.hitbox.x + p.hitbox.width / 2;
            const pCenterY = p.hitbox.y + p.hitbox.height / 2;

            if (p.comboStep === 1 || p.comboStep === 2) {
              const hitBoxWidth = 150;
              const hitBoxHeight = 120;
              const hitBoxX = p.facingRight ? pCenterX : pCenterX - hitBoxWidth;
              const hitBoxY = pCenterY - hitBoxHeight / 2;

              fgCtx.fillStyle = "rgba(168, 85, 247, 0.15)"; // Purple
              fgCtx.fillRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
              // fgCtx.strokeStyle = "rgba(168, 85, 247, 0.75)";
              // fgCtx.lineWidth = 2;
              // fgCtx.strokeRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
            } else if (p.comboStep === 3) {
              const hitBoxWidth = 170;
              const hitBoxHeight = 130;
              const hitBoxX = p.facingRight ? pCenterX : pCenterX - hitBoxWidth;
              const hitBoxY = pCenterY - hitBoxHeight / 2;

              fgCtx.fillStyle = "rgba(239, 68, 68, 0.15)"; // Red
              fgCtx.fillRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
              // fgCtx.strokeStyle = "rgba(239, 68, 68, 0.75)";
              // fgCtx.lineWidth = 2;
              // fgCtx.strokeRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
            }
          }

        // Draw Gogeta SSJ4 Special 4 Phase 2 hitbox
        if (p.data.id === "gogeta_ssj4" && p.comboType === "SPECIAL_4") {
          const pCenterX = p.hitbox.x + p.hitbox.width / 2;
          const pCenterY = p.hitbox.y + p.hitbox.height / 2;

          if (p.comboStep === 1) {
            const hitBoxWidth = 160;
            const hitBoxHeight = 120;
            const hitBoxX = p.facingRight ? pCenterX : pCenterX - hitBoxWidth;
            const hitBoxY = pCenterY - hitBoxHeight / 2;

            fgCtx.fillStyle = "rgba(249, 115, 22, 0.15)"; // Orange
            fgCtx.fillRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
            // fgCtx.strokeStyle = "rgba(249, 115, 22, 0.75)";
            // fgCtx.lineWidth = 2;
            // fgCtx.strokeRect(hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight);
          }
        }

        // Draw Frieza Ultimate 2 circular hitbox visual representation
        if (p.data.id === "frieza_final" && p.state === PlayerState.ULTIMATE && p.ultPhase === 3) {
          const radius = 90;
          const pCenterX = p.pos.x;
          const pCenterY = p.pos.y - 50;

          // Translucent purple fill
          fgCtx.fillStyle = "rgba(168, 85, 247, 0.15)";
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, radius, 0, Math.PI * 2);
          fgCtx.fill();

          // Stroke
          fgCtx.strokeStyle = "rgba(168, 85, 247, 0.75)";
          fgCtx.lineWidth = 3;
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, radius, 0, Math.PI * 2);
          // fgCtx.stroke();
        }

        // Draw Broly Ikari Ultimate 1 Phase 4 circular hitbox visual representation
        if (p.data.id === "broly_ikari" && p.state === PlayerState.ULTIMATE && p.ultType === 1 && p.ultPhase === 4) {
          const growDuration = 28;
          const progress = Math.min(1.0, p.ultTimer / growDuration);
          const minRadius = 20;
          const maxRadius = 160;
          const radius = minRadius + (maxRadius - minRadius) * progress;
          const pCenterX = p.pos.x;
          const pCenterY = p.pos.y - 50;

          // Translucent green/lime fill
          fgCtx.fillStyle = "rgba(34, 197, 94, 0.15)";
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, radius, 0, Math.PI * 2);
          fgCtx.fill();

          // Stroke
          fgCtx.strokeStyle = "rgba(34, 197, 94, 0.75)";
          fgCtx.lineWidth = 3;
          fgCtx.beginPath();
          fgCtx.arc(pCenterX, pCenterY, radius, 0, Math.PI * 2);
          // fgCtx.stroke();
        }

        // Draw Broly Ikari Special 3 Phase 4 rectangular hitbox visual representation
        if (p.data.id === "broly_ikari" && p.comboType === "SPECIAL_3" && p.ataque && p.comboStep === 3) {
          const boxWidth = 160;
          const boxHeight = 160;
          const boxY = p.pos.y - 100 - (boxHeight / 2);
          const boxX = p.facingRight ? (p.pos.x + 10) : (p.pos.x - 10 - boxWidth);

          // Translucent green/lime fill
          fgCtx.fillStyle = "rgba(74, 222, 128, 0.15)";
          fgCtx.fillRect(boxX, boxY, boxWidth, boxHeight);

          // Solid/glow stroke
          // fgCtx.strokeStyle = "rgba(34, 197, 94, 0.85)";
          // fgCtx.lineWidth = 3;
          // fgCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        }

        // Draw Genkidama / Hakai / Sphere Ultimate circular hitbox
        this.engine.projectiles.forEach((proj) => {
          if (proj instanceof Genkidama && proj.active) {
            let radius = proj.getHitboxRadius();
            fgCtx.strokeStyle = "rgba(255, 0, 255, 0.8)"; // Magenta for huge spheres
            fgCtx.beginPath();
            fgCtx.arc(proj.genkidamaX, proj.genkidamaY, radius, 0, Math.PI * 2);
            // fgCtx.stroke();
          }
        });

        // Draw Offensive/Attack Hitboxes
        const attackBoxes: { x: number; y: number; width: number; height: number; isActive: boolean }[] = [];

        // 1. Check Super Dash / Dragon Rush states
        if (p.state === PlayerState.DRAGON_RUSH && p.comboStep === 2) {
          const aW = h.width + 10;
          const aH = h.height + 10;
          const defaultX = p.facingRight ? h.x + h.width : h.x - aW;
          attackBoxes.push({
            x: defaultX,
            y: h.y + h.height * 0.3,
            width: aW,
            height: aH,
            isActive: true,
          });
        }

        // 2. Check Standard Melee or Specials
        const config = p.data.spriteConfig;
        const animKey = p.lastAnimKey || p.state;
        const anim = config?.animations?.[animKey];

        const isAttackingState =
          p.state === PlayerState.ATTACKING ||
          p.state === PlayerState.JUMP_ATTACK ||
          p.state === PlayerState.CROUCH_ATTACK ||
          (p.comboType && typeof p.comboType === "string" && (p.comboType.startsWith("SPECIAL") || p.comboType.includes("SPECIAL")));

        // Nas animações de especial 1, personagens não criam hitbox de ataque
        const isSpecial1 = 
          (p.comboType as any) === "SPECIAL" || 
          (p.comboType as any) === "SPECIAL_1" || 
          (p.comboType && typeof p.comboType === "string" && (
            (p.comboType as any) === "SPECIAL" || 
            p.comboType.startsWith("SPECIAL_1") || 
            p.comboType.startsWith("ESPECIAL_1") ||
            p.comboType.startsWith("Especial_1")
          )) ||
          (typeof animKey === "string" && (
            animKey.startsWith("SPECIAL_1") || 
            animKey.startsWith("ESPECIAL_1") || 
            animKey.startsWith("Especial_1") ||
            animKey.startsWith("ATTACK_SPECIAL")
          ));

        if (isAttackingState && anim && String(anim.dealsDamage) !== "false" && !isSpecial1) {
          if (anim.attackBoxes && anim.attackBoxes.length > 0) {
            anim.attackBoxes.forEach((box) => {
              const isDamageFrame = !box.damageFrames ||
                                    box.damageFrames.length === 0 ||
                                    box.damageFrames.includes(p.animFrame);
              const aW = box.width;
              const aH = box.height;
              const aXOff = box.offsetX;
              const aYOff = box.offsetY;
              const defaultX = p.facingRight ? h.x + h.width : h.x - aW;
              const customX = p.facingRight
                ? h.x + (aXOff !== undefined ? aXOff : h.width)
                : h.x + h.width - (aXOff !== undefined ? aXOff : h.width) - aW;

              attackBoxes.push({
                x: aXOff !== undefined ? customX : defaultX,
                y: h.y + (aYOff !== undefined ? aYOff : h.height * 0.3),
                width: aW,
                height: aH,
                isActive: isDamageFrame,
              });
            });
          } else if (anim.damageFrames && anim.damageFrames.length > 0) {
            const isDamageFrame = anim.damageFrames.includes(p.animFrame);
            const aW = anim.attackBoxWidth ?? ATTACK_WIDTH;
            const aH = anim.attackBoxHeight ?? ATTACK_HEIGHT;
            const aXOff = anim.attackBoxOffsetX ?? ATTACK_OFFSET_X;
            const aYOff = anim.attackBoxOffsetY ?? ATTACK_OFFSET_Y;
            const defaultX = p.facingRight ? h.x + h.width : h.x - aW;
            const customX = p.facingRight
              ? h.x + (aXOff !== undefined ? aXOff : h.width)
              : h.x + h.width - (aXOff !== undefined ? aXOff : h.width) - aW;

            attackBoxes.push({
              x: aXOff !== undefined ? customX : defaultX,
              y: h.y + (aYOff !== undefined ? aYOff : h.height * 0.3),
              width: aW,
              height: aH,
              isActive: isDamageFrame,
            });
          } else {
            // Default damage frames logic
            const totalFrames = anim.frames || 6;
            const targetFrame = Math.floor(totalFrames * 0.35);
            const isDamageFrame = p.animFrame === targetFrame;
            const aW = anim.attackBoxWidth ?? ATTACK_WIDTH;
            const aH = anim.attackBoxHeight ?? ATTACK_HEIGHT;
            const aXOff = anim.attackBoxOffsetX ?? ATTACK_OFFSET_X;
            const aYOff = anim.attackBoxOffsetY ?? ATTACK_OFFSET_Y;
            const defaultX = p.facingRight ? h.x + h.width : h.x - aW;
            const customX = p.facingRight
              ? h.x + (aXOff !== undefined ? aXOff : h.width)
              : h.x + h.width - (aXOff !== undefined ? aXOff : h.width) - aW;

            attackBoxes.push({
              x: aXOff !== undefined ? customX : defaultX,
              y: h.y + (aYOff !== undefined ? aYOff : h.height * 0.3),
              width: aW,
              height: aH,
              isActive: isDamageFrame,
            });
          }
        }

        // Draw each accumulated attack box
        attackBoxes.forEach((box) => {
          if (box.isActive) {
            fgCtx.fillStyle = "rgba(220, 38, 38, 0.25)"; // Semi-transparent red fill for active attack
            fgCtx.strokeStyle = "rgba(220, 38, 38, 0.85)"; // Solid bright red for active attack
            fgCtx.fillRect(box.x, box.y, box.width, box.height);
            // fgCtx.strokeRect(box.x, box.y, box.width, box.height);
          } else {
            fgCtx.fillStyle = "rgba(245, 158, 11, 0.08)"; // Semi-transparent yellow-orange for passive sweep area
            fgCtx.strokeStyle = "rgba(245, 158, 11, 0.4)"; // Light orange for passive frames
            fgCtx.fillRect(box.x, box.y, box.width, box.height);
            // fgCtx.strokeRect(box.x, box.y, box.width, box.height);
          }
        });
      });

      // Draw Projectile Hitboxes
      for (const p of this.engine.projectiles) {
        if (p.isBeam) {
          // Draw Start (Início)
          const polyStart = CollisionHelper.getBeamPartVertices(p, this.engine, "start");
          if (polyStart && polyStart.length === 4) {
            fgCtx.strokeStyle = "rgba(59, 130, 246, 0.85)"; // Blue for Início
            fgCtx.beginPath();
            fgCtx.moveTo(polyStart[0].x, polyStart[0].y);
            fgCtx.lineTo(polyStart[1].x, polyStart[1].y);
            fgCtx.lineTo(polyStart[2].x, polyStart[2].y);
            fgCtx.lineTo(polyStart[3].x, polyStart[3].y);
            fgCtx.closePath();
            // fgCtx.stroke();
          }

          // Draw Middle (Meio)
          const polyMiddle = CollisionHelper.getBeamPartVertices(p, this.engine, "middle");
          if (polyMiddle && polyMiddle.length === 4) {
            fgCtx.strokeStyle = "rgba(249, 115, 22, 0.85)"; // Orange for Meio
            fgCtx.beginPath();
            fgCtx.moveTo(polyMiddle[0].x, polyMiddle[0].y);
            fgCtx.lineTo(polyMiddle[1].x, polyMiddle[1].y);
            fgCtx.lineTo(polyMiddle[2].x, polyMiddle[2].y);
            fgCtx.lineTo(polyMiddle[3].x, polyMiddle[3].y);
            fgCtx.closePath();
            // fgCtx.stroke();
          }

          // Draw End/Tip (Ponta)
          const polyEnd = CollisionHelper.getBeamPartVertices(p, this.engine, "end");
          if (polyEnd && polyEnd.length === 4) {
            fgCtx.strokeStyle = "rgba(239, 68, 68, 0.9)"; // Red for Ponta
            fgCtx.beginPath();
            fgCtx.moveTo(polyEnd[0].x, polyEnd[0].y);
            fgCtx.lineTo(polyEnd[1].x, polyEnd[1].y);
            fgCtx.lineTo(polyEnd[2].x, polyEnd[2].y);
            fgCtx.lineTo(polyEnd[3].x, polyEnd[3].y);
            fgCtx.closePath();
            // fgCtx.stroke();
          }
        } else {
          fgCtx.strokeStyle = "rgba(234, 179, 8, 0.8)"; // yellow-500
          const poly = CollisionHelper.getProjectileVertices(p, this.engine);
          if (poly && poly.length === 4) {
            fgCtx.beginPath();
            fgCtx.moveTo(poly[0].x, poly[0].y);
            fgCtx.lineTo(poly[1].x, poly[1].y);
            fgCtx.lineTo(poly[2].x, poly[2].y);
            fgCtx.lineTo(poly[3].x, poly[3].y);
            fgCtx.closePath();
            // fgCtx.stroke();
          } else {
            let px =
              p.vx > 0
                ? p.x + (p.customOffsetX || 0)
                : p.x - (p.customOffsetX || 0);
            let py = p.y + (p.customOffsetY || 0);
            let pw = p.width;
            let ph = p.height;
            // fgCtx.strokeRect(px, py, pw, ph);
          }
        }
      }
      fgCtx.restore();
    }

    // this.engine.particleManager.draw(fgCtx);

    // Draw Physical Ground Debris Particles (DGDPS) in front of characters on the foreground layer
    GroundEnergyManager.getInstance().drawGroundParticles(
      fgCtx,
      this.engine.stageTheme,
    );

    ctx.restore();
    fgCtx.restore();

    if (this.engine.introFadeAlpha > 0) {
      fgCtx.fillStyle = `rgba(0, 0, 0, ${this.engine.introFadeAlpha})`;
      fgCtx.fillRect(0, 0, viewW, viewH);
      fgCtx.fillStyle = `rgba(0, 0, 0, ${this.engine.introFadeAlpha})`;
      fgCtx.fillRect(0, 0, viewW, viewH);
    }
  }
  public drawGenkidamaProjectile(ctx: CanvasRenderingContext2D, p: Genkidama) {
    let activeId = p.baseProjectileId;
    if (p.genkidamaState === "ground") {
      activeId = p.baseProjectileId + "_GROUND";
    } else if (p.genkidamaState === "explode") {
      activeId = p.baseProjectileId + "_EXPLODE";
    }

    const keyManager = ProjectileConfigKeyManager.getInstance();
    let finalFamily = keyManager.getProjectileConfig(activeId);
    if (!finalFamily && p.genkidamaState === "ground") {
      // Fallback for ground to base
      finalFamily = keyManager.getProjectileConfig(p.baseProjectileId);
    }
    if (!finalFamily && p.genkidamaState === "explode") {
      const baseConfig = keyManager.getProjectileConfig(p.baseProjectileId) as any;
      if (baseConfig && baseConfig.baseProjectileId) {
        finalFamily = keyManager.getProjectileConfig(baseConfig.baseProjectileId + "_EXPLODE");
      }
    }
    if (!finalFamily && p.genkidamaState === "explode") {
      let fallbackKey = "GENKIDAMA_1_EXPLODE";
      const baseKey = p.baseProjectileId.toUpperCase();
      if (baseKey.includes("GENKIDAMA_3") || baseKey.includes("GENKIDAMA_5") || baseKey.includes("GENKIDAMA_7")) {
        fallbackKey = "GENKIDAMA_3_EXPLODE";
      } else if (baseKey.includes("GENKIDAMA_2")) {
        fallbackKey = "GENKIDAMA_2_EXPLODE";
      }
      finalFamily = keyManager.getProjectileConfig(fallbackKey);
    }
    if (!finalFamily) return;

    const isEgo = p.baseProjectileId === "GENKIDAMA_2";
    const isHakai = p.baseProjectileId === "GENKIDAMA_3";
    const glowColor =
      finalFamily?.color ||
      (isEgo ? "#7e22ce" : isHakai ? "#c026d3" : "#60a5fa");
    const particleColor =
      finalFamily?.color ||
      (isEgo ? "#4c1d95" : isHakai ? "#86198f" : "#3b82f6");

    // 1. Draw custom flying/gathering particles for visual depth
    if (p.genkidamaParticles && p.genkidamaParticles.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const part of p.genkidamaParticles) {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; // White core
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Render the Genkidama sphere itself
    const gAnim = finalFamily.middle;
    if (gAnim && gAnim.imageUrl) {
      const gx = p.genkidamaX;
      const gy = p.genkidamaY;
      const baseScale = gAnim.scale || 2.2;
      const dynamicScale = p.genkidamaState === "explode" ? 1.0 : (p.genkidamaScale !== undefined ? p.genkidamaScale : 1);
      let scaleMultiplier = baseScale * dynamicScale;

      if ((p.baseProjectileId === "GENKIDAMA_3" || p.baseProjectileId === "CHAVE_GENKIDAMA_5") && p.genkidamaState !== "explode") {
        scaleMultiplier = 2.5 * dynamicScale;
      }

      const animManager = this.engine.animationManager;
      const originalFrameImg = animManager.getGifFrame(
        gAnim.imageUrl,
        p.genkidamaFrame || 0,
      );
      if (originalFrameImg) {
        const frameCacheKey = `${gAnim.imageUrl}_${p.genkidamaFrame || 0}`;

        let filters: string[] = [];
        const rRotate = finalFamily?.projectileHueRotate;
        const saturate = finalFamily?.projectileSaturate;
        const brightness = finalFamily?.projectileBrightness;
        const contrast = finalFamily?.projectileContrast;
        const opacity = finalFamily?.projectileOpacity;

        if (rRotate !== undefined) filters.push(`hue-rotate(${rRotate}deg)`);
        if (saturate !== undefined) filters.push(`saturate(${saturate})`);
        if (brightness !== undefined) filters.push(`brightness(${brightness})`);
        if (contrast !== undefined) filters.push(`contrast(${contrast})`);

        const padding = 30;
        const color = finalFamily?.color || "#ffffff";

        const filteredCanvas = animManager.getFilteredImg(
          originalFrameImg,
          color,
          filters,
          frameCacheKey,
          originalFrameImg.width,
          originalFrameImg.height,
          padding,
        );

        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        if (opacity !== undefined) {
          ctx.globalAlpha = opacity;
        }

        ctx.translate(gx, gy);

        if (p.genkidamaSquishTimer && p.genkidamaSquishTimer > 0) {
          const progress = p.genkidamaSquishTimer / 60;
          const squishAmount = Math.sin(progress * Math.PI);
          const sX = 1.0 + squishAmount * 0.1875;
          const sY = Math.max(0.05, 1.0 - squishAmount * 0.1);
          ctx.scale(sX, sY);
        }

        const imgW = originalFrameImg.width;
        const imgH = originalFrameImg.height;
        const paddedW = imgW + 2 * padding;
        const paddedH = imgH + 2 * padding;

        const destPaddedW = paddedW * scaleMultiplier;
        const destPaddedH = paddedH * scaleMultiplier;

        ctx.drawImage(
          filteredCanvas,
          -destPaddedW / 2,
          -destPaddedH / 2,
          destPaddedW,
          destPaddedH,
        );
        ctx.restore();
      }
    }
  }
  public drawFriezaBeamSpecial(ctx: CanvasRenderingContext2D, p: Projectile) {
    const family = ProjectileConfigKeyManager.getInstance().getProjectileConfig("fechosenergia_10");
    if (!family || !family.middle) return;

    const img = this.engine.animationManager.getGifFrame(
      family.middle.imageUrl,
      p.animFrame,
      p.freezeOnLastFrame
    );
    if (!img) return;

    const scale = p.customScale ?? family.middle.scale ?? 2.0;
    const imgW = img.width;
    const imgH = img.height;
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    ctx.save();
    // Move to bottom-center of the sprite
    ctx.translate(p.x, p.y);

    const facingRight = p.initialFacingRight ?? true;
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    // Origin is bottom center, so top left is at (-scaledW/2, -scaledH)
    ctx.drawImage(
      img as CanvasImageSource,
      -scaledW / 2,
      -scaledH,
      scaledW,
      scaledH
    );

    ctx.restore();
  }
  public drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    if (p.beamFamilyId === "fechosenergia_10") {
      this.drawFriezaBeamSpecial(ctx, p);
      return;
    }
    if (p instanceof Genkidama) {
      this.drawGenkidamaProjectile(ctx, p);
      return;
    }
    if (p.isBeam && p.beamFamilyId) {
      const family = BeamConfigKeyManager.getInstance().getBeamConfig(
        p.beamFamilyId,
      );
      if (!family) return;

      const ownerData =
        p.ownerId === "p1"
          ? this.engine.player1.data
          : this.engine.player2.data;
      const charOverrides =
        p.sourceAnimConfig?.beamConfig ??
        p.customAnimData?.beamConfig ??
        ownerData.beamOverrides?.[p.beamFamilyId];

      const finalFamily = {
        ...family,
        ...charOverrides,
      };

      const startAnim = family.start
        ? { ...family.start, ...(charOverrides?.start as any) }
        : undefined;
      const midAnim = family.middle
        ? { ...family.middle, ...(charOverrides?.middle as any) }
        : family.middle;
      const endAnim = family.end
        ? { ...family.end, ...(charOverrides?.end as any) }
        : undefined;

      const finalRotation =
        p.rotation ??
        p.sourceAnimConfig?.rotation ??
        p.customAnimData?.rotation ??
        midAnim?.rotation ??
        startAnim?.rotation;

      if (midAnim) {
        const facingRight = p.initialFacingRight ?? p.vx > 0;

        let spawnX = facingRight ? p.x : p.x + p.width;
        let startY = p.y;

        spawnX += facingRight
          ? p.customOffsetX || 0
          : -(p.customOffsetX || 0);
        startY += p.customOffsetY || 0;

        // --- OPTIMIZATION 1: Cap drawn beam width dynamically based on camera visibility state ---
        const visibleBounds = this.engine.camera
          ? this.engine.camera.getVisibleBounds()
          : null;
        let maxVisibleWidth = p.width;
        if (visibleBounds && !this.engine.isBeamClashActive) {
          const padding = 350; // extra padding to safely avoid visual popping on dynamic camera movements/shakes
          if (facingRight) {
            maxVisibleWidth = Math.min(
              p.width,
              visibleBounds.right - spawnX + padding,
            );
          } else {
            maxVisibleWidth = Math.min(
              p.width,
              spawnX - visibleBounds.left + padding,
            );
          }
          maxVisibleWidth = Math.max(0, maxVisibleWidth);
        }

        let filters: string[] = [];
        if (ownerData.id === "goku_black_rose") {
          if (finalFamily.beamHueRotate === undefined || finalFamily.beamHueRotate === 0) {
            filters.push("hue-rotate(130deg)");
          }
        }

        if (
          finalFamily.beamHueRotate !== undefined &&
          finalFamily.beamHueRotate !== 0
        ) {
          filters.push(`hue-rotate(${finalFamily.beamHueRotate}deg)`);
        }

        if (
          finalFamily.beamSaturate !== undefined &&
          finalFamily.beamSaturate !== 1
        ) {
          filters.push(`saturate(${finalFamily.beamSaturate})`);
        }

        if (
          finalFamily.beamBrightness !== undefined &&
          finalFamily.beamBrightness !== 1
        ) {
          filters.push(`brightness(${finalFamily.beamBrightness})`);
        }

        if (
          finalFamily.beamContrast !== undefined &&
          finalFamily.beamContrast !== 1
        ) {
          filters.push(`contrast(${finalFamily.beamContrast})`);
        }

        // --- ULTRA OPTIMIZATION: Direct GPU-accelerated drawing on the main canvas context ---
        // This completely eliminates frame rate drops and lag spikes (avoiding massive full-screen canvas copies/filters on every tick).
        const targetCtx = ctx;
        ctx.save();

        if (filters.length > 0) {
          targetCtx.filter = filters.join(" ");
        }

        if (finalFamily.beamOpacity !== undefined) {
          targetCtx.globalAlpha =
            targetCtx.globalAlpha * finalFamily.beamOpacity;
        }

        if (p.verticalScale !== undefined && p.verticalScale !== 1.0) {
          const centerY = startY;
          targetCtx.translate(0, centerY);
          targetCtx.scale(1, p.verticalScale);
          targetCtx.translate(0, -centerY);
        }

        const midOffsetX = midAnim.offsetX || 0;
        const midOffsetY = midAnim.offsetY || 0;
        const scale = p.customScale ?? midAnim.scale ?? 2.2;

        const startScale = p.customScale ?? startAnim?.scale ?? scale;
        const endScale = p.customScale ?? endAnim?.scale ?? scale;

        const startW = startAnim ? CollisionHelper.getActualFrameWidth(startAnim, p.animFrame) * startScale : 80 * startScale;
        const endW = endAnim ? CollisionHelper.getActualFrameWidth(endAnim, p.animFrame) * endScale : 80 * endScale;

        // Left of Meio is aligned to center of Inicio (startW / 2, taking into account any custom origins/centers/offsets)
        let midLeft = 0;
        if (startAnim) {
          const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
          const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
          midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
        } else {
          midLeft = 0;
        }

        // Right of Meio is aligned to center of Ponta (maxVisibleWidth, taking into account any custom origins/centers/offsets of the end frame)
        let midRight = maxVisibleWidth;
        if (endAnim) {
          const oxEnd = endAnim.originX !== undefined ? endAnim.originX : 0;
          const cxEnd = endAnim.centerX !== undefined ? endAnim.centerX : endW / 2;
          midRight = maxVisibleWidth + (oxEnd - cxEnd) + (endAnim.offsetX || 0) + endW / 2;
        } else {
          midRight = maxVisibleWidth;
        }
        midRight = Math.max(midLeft, midRight);
        const drawMidWidth = midRight - midLeft;

        // --- LAYER 1: Draw Loop (Middle) ---
        const baseMidImg = this.engine.animationManager.getGifFrame(
          midAnim.imageUrl,
          p.animFrame,
        );
        if (baseMidImg) {
          let midImg = baseMidImg;
          if (finalFamily?.color && finalFamily.color !== "#ffffff") {
            midImg = this.engine.animationManager.getTintedImg(
              baseMidImg,
              finalFamily.color,
              `${midAnim.imageUrl}_${p.animFrame}`,
              baseMidImg.width,
              baseMidImg.height,
            );
          }
          targetCtx.save();
          targetCtx.globalCompositeOperation = "source-over";
          const h = midImg.height || midAnim.frameHeight || 100;

          targetCtx.translate(spawnX, startY);
          if (!facingRight) {
            targetCtx.scale(-1, 1);
          }
          if (finalRotation) {
            targetCtx.rotate((finalRotation * Math.PI) / 180);
          }
          if (midOffsetX !== 0 || midOffsetY !== 0) {
            targetCtx.translate(midOffsetX, midOffsetY);
          }

          // Always draw middle segments sequentially (Z-Index/layer order incremented back-to-front in growth direction)
          const beamWidth = Math.max(0, drawMidWidth) / scale;
          targetCtx.translate(midLeft, (-h * scale) / 2 + 5);
          targetCtx.scale(scale, scale);

          const segmentWidth = midImg.width || midAnim.frameWidth || h;
          const spacing = typeof midAnim.beamSpacing === "number" ? midAnim.beamSpacing : 0;
          const totalSegmentWidth = Math.max(
            1,
            segmentWidth + spacing,
          );
          const numRepeats = Math.ceil(beamWidth / totalSegmentWidth) + 1;
          const moveX = 0;

          // Ultra-optimized, clip-free math-based rendering of segmented textures
          // Rendered sequentially so that each new segment has an incremented rendering layer (Z-Index/above previous)
          for (let i = 0; i <= numRepeats; i++) {
            let dx = i * totalSegmentWidth - moveX;
            let dw = segmentWidth;
            let sx = 0;
            let sw = segmentWidth;

            if (dx < 0) {
              const overlap = -dx;
              sx += overlap;
              sw -= overlap;
              dx = 0;
              dw -= overlap;
            }

            if (dx + dw > beamWidth) {
              const overlap = dx + dw - beamWidth;
              sw -= overlap;
              dw -= overlap;
            }

            const midW = (midImg as any).width || (midImg as any).naturalWidth || 0;
            const midH = (midImg as any).height || (midImg as any).naturalHeight || 0;
            if (dw > 0 && sw > 0 && midW > 0 && midH > 0 && h > 0) {
              targetCtx.drawImage(
                midImg as CanvasImageSource,
                sx,
                0,
                sw,
                h,
                dx,
                0,
                dw,
                h,
              );
            }
          }
          targetCtx.restore();
        }

        // --- LAYER 2: Draw Start Part (Início) ---
        if (startAnim) {
          targetCtx.save();
          targetCtx.translate(spawnX, startY);
          if (!facingRight) {
            targetCtx.scale(-1, 1);
          }
          if (finalRotation) {
            targetCtx.rotate((finalRotation * Math.PI) / 180);
          }
          if (midOffsetX !== 0 || midOffsetY !== 0) {
            targetCtx.translate(midOffsetX, midOffsetY);
          }

          const startAnimWithoutRotation = {
            ...startAnim,
            rotation: undefined,
          };

          this.engine.animationManager.drawFrame(
            targetCtx,
            startAnimWithoutRotation,
            p.animFrame,
            0,
            5,
            startW,
            80,
            p.customScale ?? startAnim.scale ?? midAnim?.scale ?? 2.2,
            true, // Always true because scale(-1, 1) handles direction
            true, // center align Y
            finalFamily?.color, // Consistent color tinting across preview and game
          );
          targetCtx.restore();
        }

        // --- LAYER 3: Draw End Part (Ponta) ---
        if (endAnim) {
          targetCtx.save();
          targetCtx.translate(spawnX, startY);
          if (!facingRight) {
            targetCtx.scale(-1, 1);
          }
          if (finalRotation) {
            targetCtx.rotate((finalRotation * Math.PI) / 180);
          }
          if (midOffsetX !== 0 || midOffsetY !== 0) {
            targetCtx.translate(midOffsetX, midOffsetY);
          }

          const endAnimWithoutRotation = {
            ...endAnim,
            rotation: undefined,
          };

          const drawEndX = Math.max(midLeft, maxVisibleWidth);

          this.engine.animationManager.drawFrame(
            targetCtx,
            endAnimWithoutRotation,
            p.animFrame,
            drawEndX,
            5,
            0,
            10,
            p.customScale ?? endAnim.scale ?? midAnim?.scale ?? 2.2,
            true, // Always true because scale(-1, 1) handles direction
            true,
            finalFamily?.color, // Consistent color tinting across preview and game
          );
          targetCtx.restore();
        }

        ctx.restore();
        return;
      }
    } else if (p.customAnimData) {
      const anim = p.customAnimData;
      const img = this.engine.animationManager.getGifFrame(
        anim.imageUrl,
        p.animFrame,
        p.freezeOnLastFrame,
      );
      if (img) {
        ctx.save();
        const facingRight =
          p.initialFacingRight !== undefined ? p.initialFacingRight : p.vx > 0;
        const animOffsetX = anim.offsetX || 0;
        const animOffsetY = anim.offsetY || 0;
        const cx =
          p.x +
          p.width / 2 +
          (facingRight ? p.customOffsetX || 0 : -(p.customOffsetX || 0)) +
          (facingRight ? animOffsetX : -animOffsetX);
        const cy = p.y + p.height / 2 + (p.customOffsetY || 0) + animOffsetY;
        const scale = p.customScale ?? anim.scale ?? 2.2;
        const imgW = img.width || p.width;
        const imgH = img.height || p.height;

        ctx.translate(cx, cy);

        if (!facingRight) {
          ctx.scale(-1, 1);
        }

        const srcW = (img as any).width || (img as any).naturalWidth || 0;
        const srcH = (img as any).height || (img as any).naturalHeight || 0;
        if (srcW > 0 && srcH > 0 && imgW > 0 && imgH > 0) {
          ctx.drawImage(
            img as CanvasImageSource,
            -(imgW * scale) / 2,
            -(imgH * scale) / 2,
            imgW * scale,
            imgH * scale,
          );
        }
        ctx.restore();
        return;
      }
      return; // Return immediately while the high fidelity character custom animation loads
    } else if (!p.isBeam && p.beamFamilyId) {
      const family =
        ProjectileConfigKeyManager.getInstance().getProjectileConfig(
          p.beamFamilyId,
        ) ||
        (BeamConfigKeyManager.getInstance().getBeamConfig(
          p.beamFamilyId,
        ) as any);
      const ownerData =
        p.ownerId === "p1"
          ? this.engine.player1.data
          : this.engine.player2.data;
      const charOverrides =
        p.sourceAnimConfig?.projectileConfig ??
        p.sourceAnimConfig?.beamConfig ??
        p.customAnimData?.beamConfig ??
        ownerData.projectileOverrides?.[p.beamFamilyId] ??
        ownerData.beamOverrides?.[p.beamFamilyId];

      const finalFamily = family
        ? {
            ...family,
            ...charOverrides,
          }
        : undefined;

      const midAnim = family?.middle
        ? { ...family.middle, ...(charOverrides?.middle as any) }
        : family?.middle;

      let animToDraw = undefined;
      if (p.beamFamilyId === "ZAMASU_CUSTOM" && p.customAnimData) {
        animToDraw = p.customAnimData;
      } else if (family && midAnim) {
        animToDraw = midAnim;
      }

      if (animToDraw) {
        const anim = animToDraw;
        const img = this.engine.animationManager.getGifFrame(
          anim.imageUrl,
          p.animFrame,
          p.freezeOnLastFrame,
        );
        if (img) {
          const animManager = this.engine.animationManager;
          const frameCacheKey = `${anim.imageUrl}_${p.animFrame}`;

          let filters: string[] = [];
          let opacity = undefined;

          if (finalFamily) {
            const hRotate =
              (finalFamily as any).projectileHueRotate !== undefined
                ? (finalFamily as any).projectileHueRotate
                : finalFamily.beamHueRotate;
            const saturate =
              (finalFamily as any).projectileSaturate !== undefined
                ? (finalFamily as any).projectileSaturate
                : finalFamily.beamSaturate;
            const brightness =
              (finalFamily as any).projectileBrightness !== undefined
                ? (finalFamily as any).projectileBrightness
                : finalFamily.beamBrightness;
            const contrast =
              (finalFamily as any).projectileContrast !== undefined
                ? (finalFamily as any).projectileContrast
                : finalFamily.beamContrast;
            opacity =
              (finalFamily as any).projectileOpacity !== undefined
                ? (finalFamily as any).projectileOpacity
                : finalFamily.beamOpacity;

            if (hRotate !== undefined)
              filters.push(`hue-rotate(${hRotate}deg)`);
            if (saturate !== undefined) filters.push(`saturate(${saturate})`);
            if (brightness !== undefined)
              filters.push(`brightness(${brightness})`);
            if (contrast !== undefined) filters.push(`contrast(${contrast})`);
          }

          const padding = 30;
          const color = finalFamily?.color || "#ffffff";

          const filteredImg = animManager.getFilteredImg(
            img,
            color,
            filters,
            frameCacheKey,
            img.width,
            img.height,
            padding,
          );

          ctx.save();
          if (p.beamFamilyId !== "ZAMASU_CUSTOM") {
            ctx.globalCompositeOperation = "source-over";
          }
          if (opacity !== undefined) {
            ctx.globalAlpha = opacity;
          }

          const facingRight = p.initialFacingRight ?? p.vx > 0;
          const animOffsetX = anim.offsetX || 0;
          const animOffsetY = anim.offsetY || 0;
          const cx =
            p.x +
            p.width / 2 +
            (facingRight ? p.customOffsetX || 0 : -(p.customOffsetX || 0)) +
            (facingRight ? animOffsetX : -animOffsetX);
          const cy = p.y + p.height / 2 + (p.customOffsetY || 0) + animOffsetY;
          const scale = p.customScale ?? anim.scale ?? 1.5;
          const imgW = img.width || p.width;
          const imgH = img.height || p.height;

          ctx.translate(cx, cy);

          if (!facingRight) {
            ctx.scale(-1, 1);
            if (p.beamFamilyId !== "FECHO_5") {
              const angle =
                p.rotation !== undefined
                  ? (p.rotation * Math.PI) / 180
                  : Math.atan2(p.vy, -p.vx);
              ctx.rotate(angle);
            }
          } else {
            if (p.beamFamilyId !== "FECHO_5") {
              const angle =
                p.rotation !== undefined
                  ? (p.rotation * Math.PI) / 180
                  : Math.atan2(p.vy, p.vx);
              ctx.rotate(angle);
            }
          }

          const paddedW = imgW + 2 * padding;
          const paddedH = imgH + 2 * padding;

          const filtW = (filteredImg as any).width || (filteredImg as any).naturalWidth || 0;
          const filtH = (filteredImg as any).height || (filteredImg as any).naturalHeight || 0;
          if (filtW > 0 && filtH > 0 && paddedW > 0 && paddedH > 0) {
            ctx.drawImage(
              filteredImg as CanvasImageSource,
              (-paddedW * scale) / 2,
              (-paddedH * scale) / 2,
              paddedW * scale,
              paddedH * scale,
            );
          }
          ctx.restore();
          return;
        }
        return; // Return immediately while the high fidelity database animation frame loads
      }
    }

    // Explicitly do not render any device-drawn/device-rendered fallback circles/arcs to keep pure sprite-art graphics
    return;
  }
  public stageOverrides: any = {};

  // Method to set overrides from external source
  public setStageOverrides(overrides: any) {
    this.stageOverrides = overrides;
    const stageInfo = STAGE_DB.find((s) => s.id === this.engine.stageTheme);
    const stageSpec = this.stageOverrides[this.engine.stageTheme] || {};
    this.engine.worldWidth =
      stageSpec.worldWidth ?? stageInfo?.worldWidth ?? 2000;
    this.engine.groundY = stageSpec.groundY ?? stageInfo?.groundY ?? 150;
    this.engine.physLimitLeft =
      stageSpec.physLimitLeft ?? stageInfo?.physLimitLeft ?? -225;
    this.engine.physLimitRight =
      stageSpec.physLimitRight ??
      stageInfo?.physLimitRight ??
      this.engine.worldWidth + 225;
    if (this.engine.camera) {
      this.engine.camera.worldWidth = this.engine.worldWidth;
      const limitLeft = stageSpec.limitLeft ?? stageInfo?.limitLeft;
      const limitRight = stageSpec.limitRight ?? stageInfo?.limitRight;
      const limitTop = stageSpec.limitTop ?? stageInfo?.limitTop;
      const limitBottom = stageSpec.limitBottom ?? stageInfo?.limitBottom;
      this.engine.camera.setLimits(
        limitLeft,
        limitRight,
        limitTop,
        limitBottom,
      );
    }
  }

  public drawBackground(ctx: CanvasRenderingContext2D) {
    const stageInfo = STAGE_DB.find((s) => s.id === this.engine.stageTheme);
    const overrides = this.stageOverrides[this.engine.stageTheme] || {};

    const allPlayers = [
      ...(this.engine.p1Team || []),
      ...(this.engine.p2Team || []),
    ].filter(Boolean) as Player[];

    const playersToCheck = [
      this.engine.player1,
      this.engine.player2,
      ...allPlayers,
    ].filter(Boolean) as Player[];

    const hasUltimateOrSpecial = playersToCheck.some((p) => {
      if (p.state === PlayerState.STANDBY) return false;
      const isUlt =
        p.state === PlayerState.ULTIMATE || p.state === PlayerState.ULTIMATE_2;
      const isSpec =
        p.ataque &&
        typeof p.comboType === "string" &&
        p.comboType.startsWith("SPECIAL");
      return isUlt || isSpec;
    });

    const targetDimAlpha = hasUltimateOrSpecial ? 0.45 : 0;
    if (this.currentDimAlpha < targetDimAlpha) {
      this.currentDimAlpha = Math.min(
        targetDimAlpha,
        this.currentDimAlpha + 0.05,
      );
    } else if (this.currentDimAlpha > targetDimAlpha) {
      this.currentDimAlpha = Math.max(
        targetDimAlpha,
        this.currentDimAlpha - 0.05,
      );
    }

    // Fallback sky colors
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bgTheme = (this.engine.stageTheme || "").toUpperCase().trim();
    if (bgTheme === "ARENA") {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "ALIEN") {
      ctx.fillStyle = "#2d4b31";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "NIGHT") {
      ctx.fillStyle = "#0a0a2a";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "DARK_DIMENSION") {
      ctx.fillStyle = "#1e0b38";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "TORNEIO_DO_PODER") {
      ctx.fillStyle = "#1e0524";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "KAME_HOUSE") {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "INSIDE_BUU") {
      ctx.fillStyle = "#1e0814";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "DESERTO") {
      ctx.fillStyle = "#9c4d1f";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (bgTheme === "ESPACO") {
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    if (this.currentDimAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.currentDimAlpha})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.restore();

    if (stageInfo?.layers && stageInfo.layers.length > 0) {
      // Layers rendering
      stageInfo.layers.forEach((layer, index) => {
        if (!GameRenderer.loadedBgs[layer.img]) {
          GameRenderer.loadedBgs[layer.img] =
            AnimationManager.getInstance().loadTexture(layer.img);
        }
        const bgImg = GameRenderer.loadedBgs[layer.img];
        if (bgImg && bgImg.complete && bgImg.naturalWidth !== 0) {
          const lScale = layer.scale ?? 1.0;
          const bgW = bgImg.naturalWidth * lScale;
          const bgH = bgImg.naturalHeight * lScale;

          const centerX = this.engine.worldWidth / 2;
          const centerY = WORLD_HEIGHT / 2;
          const cam = this.engine.camera.getRenderPosition();

          const pFactorX = layer.parallaxFactorX ?? 0.5;
          const pFactorY = layer.parallaxFactorY ?? 0.2;
          const userOffsetX = layer.xOffset ?? 0;
          const userOffsetY = layer.yOffset ?? 0;

          // bgX/bgY mapped based on center. parallaxFactorX 1.0 means it moves 1:1 with camera
          const bgX =
            centerX - bgW / 2 + (cam.x - centerX) * pFactorX + userOffsetX;
          const bgY =
            centerY - bgH / 2 + (cam.y - centerY) * pFactorY + userOffsetY;

          ctx.save();
          this.applyStageEffectFilters(ctx, stageInfo.effectConfigKey);

          if (index === 3) {
            GroundEnergyManager.getInstance().drawGround(
              ctx,
              bgImg,
              bgX,
              bgY,
              bgW,
              bgH,
              stageInfo,
            );
          } else {
            ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);
          }

          // Darken background elements during Ultimate/Special, except layer 4 (index === 3)
          if (this.currentDimAlpha > 0 && index !== 3) {
            ctx.save();
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = `rgba(0, 0, 0, ${this.currentDimAlpha})`;
            ctx.fillRect(bgX, bgY, bgW, bgH);
            ctx.restore();
          }
          ctx.restore();
        }
      });
      return;
    }

    // Default single-image fallback
    const imgUrl = stageInfo?.img;
    const baseScale = stageInfo?.scale ?? 1.0;
    const baseOffsetY = stageInfo?.yOffset ?? 0;

    const finalScale = overrides.scale ?? baseScale;
    const finalOffsetY = overrides.yOffset ?? baseOffsetY;
    const isGif = imgUrl?.toLowerCase().endsWith(".gif");

    if (imgUrl && !GameRenderer.loadedBgs[this.engine.stageTheme]) {
      if (isGif) {
        AnimationManager.getInstance().loadGif(imgUrl);
        GameRenderer.loadedBgs[this.engine.stageTheme] = new Image(); // dummy to prevent reload
      } else {
        GameRenderer.loadedBgs[this.engine.stageTheme] =
          AnimationManager.getInstance().loadTexture(imgUrl);
      }
    }

    let bgDrawSource: CanvasImageSource | null = null;
    let fallbackToColor = true;

    if (isGif && imgUrl) {
      const frameCount =
        AnimationManager.getInstance().getGifFrameCount(imgUrl);
      if (frameCount > 0) {
        // approx 10 FPS
        const frameIdx = Math.floor(this.engine.frameCount / 6) % frameCount;
        const obj = AnimationManager.getInstance().getGifFrame(
          imgUrl,
          frameIdx,
        );
        if (obj) {
          bgDrawSource = obj as CanvasImageSource;
          fallbackToColor = false;
        }
      }
    } else {
      const bgImg = GameRenderer.loadedBgs[this.engine.stageTheme];
      if (bgImg && bgImg.complete && bgImg.naturalWidth !== 0) {
        bgDrawSource = bgImg;
        fallbackToColor = false;
      }
    }

    if (bgDrawSource && !fallbackToColor) {
      const parallaxFactorX = 0;
      const parallaxFactorY = 0;

      // Scale background to prevent clipping
      const bgW = this.engine.worldWidth * (1 + parallaxFactorX) * finalScale;
      const bgH = WORLD_HEIGHT * (1 + parallaxFactorY) * finalScale;

      const centerX = this.engine.worldWidth / 2;
      const centerY = WORLD_HEIGHT / 2;

      const cam = this.engine.camera.getRenderPosition();

      const bgX = centerX - bgW / 2 + (cam.x - centerX) * parallaxFactorX;

      const bgY =
        centerY - bgH / 2 + (cam.y - centerY) * parallaxFactorY + finalOffsetY;

      ctx.drawImage(bgDrawSource, bgX, bgY, bgW, bgH);

      if (this.currentDimAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = `rgba(0, 0, 0, ${this.currentDimAlpha})`;
        ctx.fillRect(bgX, bgY, bgW, bgH);
        ctx.restore();
      }
    } else {
      ctx.lineWidth = 2;
      const gridSize = 200;
      ctx.beginPath();
      for (let x = 0; x <= this.engine.worldWidth; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
      }
      for (let y = 0; y <= WORLD_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(this.engine.worldWidth, y);
      }
      ctx.stroke();
    }
  }
  public drawEnvironment(ctx: CanvasRenderingContext2D) {
    const stageInfo = STAGE_DB.find((s) => s.id === this.engine.stageTheme);
    const imgUrl = stageInfo?.img;
    const isGif = imgUrl?.toLowerCase().endsWith(".gif");

    if (stageInfo?.layers && stageInfo.layers.length > 0) {
      return;
    }

    ctx.save();
    this.applyStageEffectFilters(ctx, stageInfo?.effectConfigKey);

    let hasLoadedBg = false;
    if (isGif && imgUrl) {
      hasLoadedBg = AnimationManager.getInstance().getGifFrameCount(imgUrl) > 0;
    } else {
      const bgImg = GameRenderer.loadedBgs[this.engine.stageTheme];
      hasLoadedBg = !!(bgImg && bgImg.complete && bgImg.naturalWidth !== 0);
    }

    if (hasLoadedBg) {
      ctx.restore();
      // If image is loaded, we don't draw the solid ground blocking it unless we want a flat platform
      // Let's just return to not block the image
      return;
    }

    const groundY = WORLD_HEIGHT - this.engine.groundY;
    const groundHeight = this.engine.groundY;
    const groundWidth = this.engine.worldWidth;

    GroundEnergyManager.getInstance().drawFallbackGround(
      ctx,
      groundY,
      groundWidth,
      groundHeight,
    );
    ctx.restore();
  }

  private applyStageEffectFilters(ctx: CanvasRenderingContext2D, effectConfigKey: string | undefined) {
    if (!effectConfigKey) return;
    const config = EffectConfigKeyManager.getInstance().getEffect(effectConfigKey);
    if (config) {
      let filters = "";
      if (config.effectHueRotate) filters += ` hue-rotate(${config.effectHueRotate}deg)`;
      if (config.effectSaturate !== undefined && config.effectSaturate !== 1) filters += ` saturate(${config.effectSaturate})`;
      if (config.effectBrightness !== undefined && config.effectBrightness !== 1) filters += ` brightness(${config.effectBrightness})`;
      if (config.effectContrast !== undefined && config.effectContrast !== 1) filters += ` contrast(${config.effectContrast})`;
      
      if (filters) ctx.filter = filters.trim();
      if (config.effectOpacity !== undefined) ctx.globalAlpha *= config.effectOpacity;
    }
  }

  private drawBeamClashWaves(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const time = this.engine.frameCount;
    const url = "/Assets/especiais/auxiliarespersonagens/1/1.gif";
    
    // Get the frame
    const totalFrames = this.engine.animationManager.getGifFrameCount(url);
    const limitFrames = totalFrames > 0 ? totalFrames : 24;
    const animFrame = Math.floor(time / 2) % limitFrames;
    const img = this.engine.animationManager.getGifFrame(url, animFrame);

    if (img) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // Dynamically query the max scale of the active beams to ensure the pressure waves are always proportional
      const p1Beam = this.engine.projectiles.find(p => p.ownerId === "p1" && p.isBeam && p.active && !p.isShrinking);
      const p2Beam = this.engine.projectiles.find(p => p.ownerId === "p2" && p.isBeam && p.active && !p.isShrinking);
      
      let baseScale = 2.2; // default fallback scale
      if (p1Beam || p2Beam) {
        const s1 = p1Beam ? (p1Beam.customScale ?? p1Beam.sourceAnimConfig?.scale ?? 2.2) : 2.2;
        const s2 = p2Beam ? (p2Beam.customScale ?? p2Beam.sourceAnimConfig?.scale ?? 2.2) : 2.2;
        baseScale = Math.max(s1, s2);
      }

      // Multiply the base scale so that the pressure waves are ALWAYS a bit larger than the two beam ends (pontas)
      const sizeMultiplier = 1.65; // This makes it elegantly larger than the beam ends
      const finalWaveScale = baseScale * sizeMultiplier;

      // Render two layered instances with clean scaling for heavy visual weight at the epicenter
      const scales = [finalWaveScale, finalWaveScale * 1.45];
      const opacities = [1.0, 0.55];
      const rotations = [0, time * 0.015];

      for (let i = 0; i < scales.length; i++) {
        const scale = scales[i];
        const w = (img.width || 120) * scale;
        const h = (img.height || 120) * scale;

        ctx.save();
        ctx.globalAlpha = opacities[i];
        ctx.translate(cx, cy);
        if (rotations[i] !== 0) {
          ctx.rotate(rotations[i]);
        }
        ctx.drawImage(img as any, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      ctx.restore();
    }
  }

}
