import { GameEngine } from "./GameEngine";
import { Player } from "./Player";
import { PlayerState } from "../types";
import { Projectile } from "./Projectile";
import { AudioManager } from "./AudioManager";
import { CollisionHelper } from "./CollisionHelper";
import { CombatManager } from "./CombatManager";

export class MuiSpecialManager {
  // Chamada no loop principal da GameEngine para controlar a progressão sequencial
  public static updateSpecialSequence(engine: GameEngine, p: Player, opp: Player): void {
    if (p.data.id !== "goku_mui") return;
    if (p.state !== PlayerState.ATTACKING && p.state !== PlayerState.JUMP_ATTACK && p.state !== PlayerState.CROUCH_ATTACK) return;
    if (!p.comboType || typeof p.comboType !== "string" || !p.comboType.startsWith("SPECIAL")) return;

    // Se o player está na sequência do Especial 1, prende o oponente
    if (p.comboType === "SPECIAL") {
      if (p.comboStep >= 0) {
        if (opp.state === PlayerState.HIT || opp.state === PlayerState.KNOCKED_DOWN) {
           const sideOffset = p.facingRight ? 40 : -40;
           opp.pos.x = p.pos.x + sideOffset;
           opp.pos.y = p.pos.y;
           opp.facingRight = !p.facingRight;
           opp.stunTimer = 180;
           opp.gravityDisabledTimer = 180;
           opp.velocity.x = 0;
           opp.velocity.y = 0;
        }
      }
    }

    // Verifica se a animação real do GIF já carregou
    const animConfig = p.data.spriteConfig?.animations?.[p.lastAnimKey || ""];
    let isLoaded = false;
    if (animConfig?.imageUrl) {
       // @ts-ignore
       const bitmaps = engine.animationManager["gifCache"].get(animConfig.imageUrl);
       isLoaded = !!bitmaps && bitmaps.length > 0;
    } else {
       isLoaded = true; // Fallback se não for GIF URL
    }

    // --- LOGICA DE EXECUÇÃO DE CADA ESPECIAL ---

    if (p.comboType === "SPECIAL") {
      // Especial 1 (Sequência de 1 hit)
      if (p.animFinished && isLoaded) {
        // Sequência terminou
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.comboType = "NONE";
        p.comboStep = 0;
        p.attackTimer = 0;
        p.animFinished = false;
        if (opp.state === PlayerState.HIT || opp.state === PlayerState.KNOCKED_DOWN) {
          opp.stunTimer = 30; // Final stun release
          opp.velocity.y = -10; // Final knockback
          opp.velocity.x = p.facingRight ? 15 : -15;
          opp.gravityDisabledTimer = 0;
        }
      }
    } 
    else if (p.comboType === "SPECIAL_3") {
      // Especial 3: 2 fases
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 2;

      if (p.comboStep === 0) {
        if (p.animFinished && isLoaded) {
          // Transiciona para Fase 2 (Teleporte + golpe)
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
          p.hasHit = false;
        }
      } else if (p.comboStep === 1) {
        // Teleporta para as costas do oponente
        if (!p.hasHit) {
          p.hasHit = true;
          const backOffset = opp.facingRight ? -50 : 50;
          p.pos.x = opp.pos.x + backOffset;
          p.pos.y = opp.pos.y;
          p.facingRight = opp.facingRight; // Ataca pelas costas na mesma direção

          AudioManager.getInstance().playSFX("vanish");
          engine.particleManager.spawn("SPARK", p.pos.x, p.pos.y, 5);

          // Aplica dano e arremessa o oponente
          opp.takeDamage(CombatManager.getDamageByPercentage(opp, 'SPECIAL', 15, 1, p));
          opp.state = PlayerState.LAUNCHED;
          opp.velocity.x = p.facingRight ? 20 : -20;
          opp.velocity.y = -5;
          opp.stunTimer = 60;
          opp.gravityDisabledTimer = 60;

          engine.camera.addScreenShake(10, 10, "PERLIN", 1.0);
          AudioManager.getInstance().playSFX("impact");
          engine.particleManager.spawn(
            "IMPACT_SPARK",
            opp.pos.x + opp.width / 2,
            opp.pos.y + opp.height / 2,
            15
          );
        }

        if (p.animFinished && isLoaded) {
          // Termina o Especial
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.comboType = "NONE";
          p.comboStep = 0;
          p.attackTimer = 0;
          p.animFinished = false;
        }
      }
    } 
    else if (p.comboType === "SPECIAL_4") {
      // Especial 4: Fase 1 (Especial_4_1) -> Fase 2 (Especial_4_2, 2 projéteis simultâneos do centro)
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 2;

      if (p.comboStep === 0) {
        if (p.animFinished && isLoaded) {
          // Transiciona para Fase 2
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
          p.hasHit = false;
        }
      } else if (p.comboStep === 1) {
        if (!p.hasHit) {
          p.hasHit = true;
          const finalKiX = p.data.spriteConfig?.kiOriginX ?? 76;
          const finalKiY = p.data.spriteConfig?.kiOriginY ?? 125;
          const centerOfCharacterX = p.x + finalKiX;
          const centerOfCharacterY = p.y + finalKiY;
          const speed = 15;
          const ownerId = p === engine.player1 ? "p1" : "p2";

          // Projétil Left
          engine.projectiles.push(
            Projectile.spawn(
              centerOfCharacterX,
              centerOfCharacterY,
              -speed,
              ownerId,
              p.data.color,
              false,
              "KI_BLAST"
            )
          );

          // Projétil Right
          engine.projectiles.push(
            Projectile.spawn(
              centerOfCharacterX,
              centerOfCharacterY,
              speed,
              ownerId,
              p.data.color,
              false,
              "KI_BLAST"
            )
          );

          AudioManager.getInstance().playSFX("attack");
          engine.camera.addScreenShake(8, 8, "IMPULSE", 1.0);
        }

        if (p.animFinished && isLoaded) {
          // Termina o Especial
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.comboType = "NONE";
          p.comboStep = 0;
          p.attackTimer = 0;
          p.animFinished = false;
        }
      }
    } 
    else if (p.comboType === "SPECIAL_5") {
      // Especial 5: Fase 1 (Parado no ar, hitbox circular, lançamento vertical)
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 2;

      // Utilizar a hitbox do personagem para detectar colisão
      const dist = CollisionHelper.testAABB(p.hitbox, opp.hitbox);

      if (dist) {
        if (!p.hasHit) {
          p.hasHit = true;
          opp.takeDamage(CombatManager.getDamageByPercentage(opp, 'SPECIAL', 15, 1, p));
          opp.state = PlayerState.LAUNCHED;
          opp.velocity.x = 0;
          opp.velocity.y = -22; // Lançado para longe verticalmente
          opp.stunTimer = 60;
          opp.gravityDisabledTimer = 60;

          engine.camera.addScreenShake(12, 12, "IMPULSE", 1.2);
          AudioManager.getInstance().playSFX("impact");
          
          const oppHBox = opp.hitbox;
          const oppCenterX = oppHBox.x + oppHBox.width / 2;
          const oppCenterY = oppHBox.y + oppHBox.height / 2;
          engine.particleManager.spawn("IMPACT_SPARK", oppCenterX, oppCenterY, 15);
        }
      }

      if (p.animFinished && isLoaded) {
        // Termina o Especial
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.comboType = "NONE";
        p.comboStep = 0;
        p.attackTimer = 0;
        p.animFinished = false;
      }
    } 
    else if (p.comboType === "SPECIAL_6") {
      // Especial 6: 
      // Fase 1: Teleporte frente oponente + hitbox
      // Fase 2: Oponente suspenso no ar por telepatia (LERP controlado)
      // Fase 3: Goku MUI sobe atravessando oponente, congela último frame, hitbox acima, lançamento longe

      if (p.comboStep === 0) {
        // Fase 1: Teleporte frente oponente
        if (!p.hasHit) {
          p.hasHit = true;
          const frontOffset = opp.facingRight ? 60 : -60;
          p.pos.x = opp.pos.x + frontOffset;
          p.pos.y = opp.pos.y;
          p.facingRight = !opp.facingRight; // Virado de frente pro oponente

          AudioManager.getInstance().playSFX("vanish");
          engine.particleManager.spawn("SPARK", p.pos.x, p.pos.y, 5);

          opp.takeDamage(CombatManager.getDamageByPercentage(opp, 'SPECIAL', 5, 1, p));
          opp.state = PlayerState.HIT;
          opp.stunTimer = 180;
          opp.gravityDisabledTimer = 180;
          opp.velocity.x = 0;
          opp.velocity.y = 0;

          engine.camera.addScreenShake(8, 8, "PERLIN", 1.0);
          AudioManager.getInstance().playSFX("impact");
          engine.particleManager.spawn(
            "IMPACT_SPARK",
            opp.pos.x + opp.width / 2,
            opp.pos.y + opp.height / 2,
            10
          );
        }

        if (p.animFinished && isLoaded) {
          // Transiciona para Fase 2 (Levitação telepática)
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
          p.hasHit = false;
        }
      } 
      else if (p.comboStep === 1) {
        // Fase 2: Levitação telepática (LERP controlado, sem impulso físico)
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.gravityDisabledTimer = 2;

        opp.velocity.x = 0;
        opp.velocity.y = 0;
        opp.gravityDisabledTimer = 2;
        opp.stunTimer = 180;

        const targetX = p.pos.x;
        const targetY = p.pos.y - 120; // Posição acima de Goku MUI
        const lerpSpeed = 0.08;
        opp.pos.x += (targetX - opp.pos.x) * lerpSpeed;
        opp.pos.y += (targetY - opp.pos.y) * lerpSpeed;

        if (p.animFinished && isLoaded) {
          // Transiciona para Fase 3 (Subida violenta congelando frame)
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
          p.hasHit = false;
        }
      } 
      else if (p.comboStep === 2) {
        // Fase 3: Executa animação Especial_6_3 e depois sobe cruzando oponente
        if (!p.animFinished) {
          p.velocity.x = 0;
          p.velocity.y = -10; // Subida suave inicial
          p.gravityDisabledTimer = 2;
        } else {
          // Congela último frame
          p.animTimer = 0;
          
          // Move o personagem verticalmente para cima
          p.velocity.x = 0;
          p.velocity.y = -20;
          p.gravityDisabledTimer = 2;

          // Hitbox acima do personagem (atravessa o oponente)
          const crossed = p.pos.y <= opp.pos.y + 20;
          if (crossed && !p.hasHit) {
            p.hasHit = true;
            opp.takeDamage(CombatManager.getDamageByPercentage(opp, 'SPECIAL', 10, 1, p));
            opp.state = PlayerState.LAUNCHED;
            opp.velocity.x = p.facingRight ? 18 : -18;
            opp.velocity.y = -10;
            opp.stunTimer = 60;
            opp.gravityDisabledTimer = 60;

            engine.camera.addScreenShake(15, 15, "IMPULSE", 1.5);
            AudioManager.getInstance().playSFX("impact");
            engine.particleManager.spawn(
              "IMPACT_SPARK",
              opp.pos.x + opp.width / 2,
              opp.pos.y + opp.height / 2,
              20
            );
          }
        }

        // Se já acertou e atravessou o oponente, finaliza
        if (p.hasHit) {
          p.state = PlayerState.FALLING;
          p.comboType = "NONE";
          p.comboStep = 0;
          p.attackTimer = 0;
          p.animFinished = false;
        }
      }
    }
  }

  // Chamada no momento em que o hitbox do SPECIAL acerta (somente para Especial 1)
  public static checkSpecialHit(engine: GameEngine, attacker: Player, defender: Player, isBlocking: boolean): boolean {
    if (
      attacker.comboType === "SPECIAL" &&
      attacker.data.id === "goku_mui" &&
      !isBlocking &&
      (attacker.state === PlayerState.ATTACKING ||
        attacker.state === PlayerState.CROUCH_ATTACK ||
        attacker.state === PlayerState.JUMP_ATTACK)
    ) {
      if (attacker.comboStep === 0) {
        // Primeiro hit: Inicia a sequência
        attacker.comboStep = 1;
        attacker.animFrame = 0;
        attacker.animFinished = false;
      }
      
      attacker.attackTimer = 180;
      attacker.hasHit = true; 

      defender.state = PlayerState.HIT;
      defender.velocity.x = 0;
      defender.velocity.y = 0;
      defender.stunTimer = 180;
      defender.gravityDisabledTimer = 180;

      const sideOffset = attacker.facingRight ? 40 : -40;
      defender.pos.x = attacker.pos.x + sideOffset;
      defender.pos.y = attacker.pos.y;
      defender.facingRight = !attacker.facingRight;

      engine.camera.addScreenShake(8, 8, "PERLIN", 1.0);
      engine.hitStopTimer = 15;
      
      const hitX = (attacker.x + defender.x) / 2;
      const hitY = defender.y + defender.height / 2;
      engine.particleManager.spawn("IMPACT_SPARK", hitX, hitY, 10);
      return true;
    }
    return false;
  }
}
