import { Player } from './Player';
import { PlayerState, Rect } from '../types';
import { GameEngine } from './GameEngine';
import { CollisionHelper } from './CollisionHelper';
import { BattleStateManager } from '../src/engine/dialogue/BattleStateManager';
import { BattleEvent } from '../src/engine/dialogue/types';

export enum PriorityLevel {
  LIGHT = 1,
  MEDIUM = 2,
  HEAVY = 3,
  SUPER = 4,
}

export class ClashManager {
  // Configs
  public static readonly CLASH_COOLDOWN_FRAMES = 30; // Evita infinitos
  public static readonly CLASH_PUSHBACK = 15; // Afastamento

  public static checkClash(p1: Player, p2: Player, engine: GameEngine): boolean {
    if (p1.hp <= 0 || p2.hp <= 0) return false;
    
    // Manage cooldowns attached dynamically to players
    if (p1["clashCooldown"] > 0) p1["clashCooldown"]--;
    if (p2["clashCooldown"] > 0) p2["clashCooldown"]--;

    if (p1["clashCooldown"] > 0 || p2["clashCooldown"] > 0) return false;

    // Apenas testar se ambos estão atacando
    if (!this.isAttackingState(p1.state) || !this.isAttackingState(p2.state)) return false;

    const p1Boxes = this.getActiveAttackBoxes(p1);
    const p2Boxes = this.getActiveAttackBoxes(p2);

    if (p1Boxes.length === 0 || p2Boxes.length === 0) return false;

    // Verifica intersecção entre as hitboxes ofensivas
    let clashed = false;
    for (const box1 of p1Boxes) {
      for (const box2 of p2Boxes) {
        if (this.intersects(box1, box2)) {
          clashed = true;
          break;
        }
      }
      if (clashed) break;
    }

    if (!clashed) return false;

    // Resolve Clash Rules
    const p1Priority = this.getAttackPriority(p1);
    const p2Priority = this.getAttackPriority(p2);

    const p1Armor = this.hasSuperArmor(p1);
    const p2Armor = this.hasSuperArmor(p2);

    // Se ambos tiverem super armor ou se as prioridades forem Iguais => Ocorre o Clash
    if ((p1Priority === p2Priority) && !p1Armor && !p2Armor) {
      this.triggerClash(p1, p2, engine);
      return true; // Clash aconteceu, cancelar hits
    }

    // Se as prioridades são diferentes e nenhum tem armor
    if (!p1Armor && !p2Armor) {
       // Maior prioridade vence, não cancelamos o hit dele, mas o menor perde o clash box
       // Poderiamos forçar um stun ou return false e deixar o checkHit do GameEngine resolver normalmente (quem tem hitbox maior atinge a hurtbox)
       // O texto diz "Se uma prioridade for maior => golpe maior vence"
       // Retornamos false e deixamos a colisão natural lidar (ou podemos cancelar a hitbox do mais fraco)
       this.cancelHitbox(p1Priority < p2Priority ? p1 : p2);
       return false; 
    }
    
    return false;
  }

  private static triggerClash(p1: Player, p2: Player, engine: GameEngine) {
    // 1) Anula o dano (já que checkClash retorna true e nós barlamos o checkHit)
    
    // 2) Cooldown para não haver multiple flashes
    p1["clashCooldown"] = this.CLASH_COOLDOWN_FRAMES;
    p2["clashCooldown"] = this.CLASH_COOLDOWN_FRAMES;

    // Report Clash event context to dialogue system (choosing speaker randomly to prevent double speech overlap)
    try {
      const randChar = Math.random() < 0.5 ? 1 : 2;
      if (randChar === 1) {
        BattleStateManager.getInstance().reportAction(p1, p2, BattleEvent.CLASH, 1);
      } else {
        BattleStateManager.getInstance().reportAction(p2, p1, BattleEvent.CLASH, 2);
      }
    } catch (e) {
      console.warn("[SPEECH_DIAL] Clash report fail:", e);
    }

    // 3) Pushback para continuação natural e não atravessar
    p1.velocity.x = p1.facingRight ? -this.CLASH_PUSHBACK : this.CLASH_PUSHBACK;
    p2.velocity.x = p2.facingRight ? -this.CLASH_PUSHBACK : this.CLASH_PUSHBACK;

    // 4) Efeitos de Hitstop - sem particulas visuais profundas ou câmera cinematográfica
    // Pode adicionar algo minimalista na UI ou som de clang
    // engine.audioManager.playSFX("clang_sound"); // opcional

    // 5) Cancela a flag de hit para que não atinja depois
    p1.hasHit = true; 
    p2.hasHit = true;
  }

  private static cancelHitbox(loser: Player) {
    loser.hasHit = true; // Força como já tivesse acertado pra não dar dano
  }

  private static getActiveAttackBoxes(p: Player): Rect[] {
    let boxes: Rect[] = [];

    // Throws e dashes não entram no sistema de clash
    if (p.state === PlayerState.DRAGON_RUSH || p.state === PlayerState.SUPER_DASH) {
      return boxes; 
    }

    const config = p.data.spriteConfig;
    const animKey = p.lastAnimKey || p.state;

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

    if (isSpecial1) {
      return [];
    }

    const anim = config?.animations[animKey];
    if (!anim) return boxes;

    // Super ataques com dealsDamage explícito falso não dão clash
    if (String(anim.dealsDamage) === "false") return boxes;

    const hAtk = p.hitbox;
    
    // Verifica attackBoxes personalizados
    if (anim.attackBoxes && anim.attackBoxes.length > 0) {
      anim.attackBoxes.forEach(box => {
        if (!box.damageFrames || box.damageFrames.length === 0 || box.damageFrames.includes(p.animFrame)) {
            const aW = box.width;
            const aH = box.height;
            const aXOff = box.offsetX;
            const aYOff = box.offsetY;
            const defaultX = p.facingRight ? hAtk.x + hAtk.width : hAtk.x - aW;
            const customX = p.facingRight
              ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
              : hAtk.x + hAtk.width - (aXOff !== undefined ? aXOff : hAtk.width) - aW;
            
            boxes.push({
              x: aXOff !== undefined ? customX : defaultX,
              y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
              width: aW,
              height: aH,
            });
        }
      });
      return boxes;
    }

    // Fallback para anim.damageFrames
    let isActive = false;
    if (anim.damageFrames && anim.damageFrames.length > 0) {
      if (anim.damageFrames.includes(p.animFrame)) isActive = true;
    } else {
      const totalFrames = anim.frames || 6;
      if (p.animFrame === Math.floor(totalFrames * 0.35)) isActive = true;
    }

    if (isActive) {
      const aW = anim.attackBoxWidth ?? 100;
      const aH = anim.attackBoxHeight ?? 50;
      const aXOff = anim.attackBoxOffsetX;
      const aYOff = anim.attackBoxOffsetY;
      const defaultX = p.facingRight ? hAtk.x + hAtk.width : hAtk.x - aW;
      const customX = p.facingRight
        ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
        : hAtk.x + hAtk.width - (aXOff !== undefined ? aXOff : hAtk.width) - aW;
      
      boxes.push({
        x: aXOff !== undefined ? customX : defaultX,
        y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
        width: aW,
        height: aH
      });
    }

    return boxes;
  }

  private static isAttackingState(state: PlayerState): boolean {
    return (
      state === PlayerState.ATTACKING ||
      state === PlayerState.CROUCH_ATTACK ||
      state === PlayerState.JUMP_ATTACK ||
      state === PlayerState.ULTIMATE
    );
  }

  private static getAttackPriority(p: Player): PriorityLevel {
    if (p.state === PlayerState.ULTIMATE) return PriorityLevel.SUPER;
    
    if (p.comboType) {
      switch(p.comboType) {
        case "LIGHT": return PriorityLevel.LIGHT;
        case "MEDIUM": return PriorityLevel.MEDIUM;
        case "HEAVY": return PriorityLevel.HEAVY;
      }
    }
    
    return PriorityLevel.LIGHT; // fallback
  }

  private static hasSuperArmor(p: Player): boolean {
    const config = p.data.spriteConfig;
    const animKey = p.lastAnimKey || p.state;
    const anim = config?.animations[animKey];
    
    // Se nas configs a animação possuir super armor mapeada (exemplo: super_armor: true)
    // Supondo acesso ao cast dinamico caso nao conste no index typing explicitamente
    return anim ? Boolean((anim as any).superArmor) : false;
  }

  private static intersects(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }
}
