import { GameEngine } from './GameEngine';
import { Player } from './Player';
import { PlayerState, IntroPhase, InputState } from '../types';
import { BattleStateManager } from '../src/engine/dialogue/BattleStateManager';
import { CharacterStateMachine, SkillType } from './CharacterStateMachine';
import { BattleEvent } from '../src/engine/dialogue/types';
import { MAX_GUARD, WORLD_HEIGHT, GRAVITY, CAM_MAX_ZOOM, SPAWN_CENTER_OFFSET } from '../constants';
import { MAX_KI, KI_GAIN_ON_DAMAGE } from '../constants';
import { AudioManager } from './AudioManager';
import { EventSystem } from './EventSystem';
export class CombatManager {
  public static handleCombatInputs(engine: GameEngine, p: Player, input: InputState): boolean {
    if (p.landingDelayTimer > 0) return false;
    if (p.airComboLockout && !p.isGrounded) return false;

    // Prevent commands if dead, KO, or Stunned
    if (
      p.hp <= 0 ||
      p.state === PlayerState.STUNNED ||
      p.state === PlayerState.GUARD_BREAK ||
      p.state === PlayerState.TAG_OUT
    )
      return false;

    const prevInput = p === engine.player1 ? engine.prevP1Input : engine.prevP2Input;

    engine.tryAssist(p, input.assist1, input.assist2);

    const transformPressed =
      input.transform && (!prevInput || !prevInput.transform);
    if (transformPressed) {
      let nextTransformId: string | undefined = undefined;
      let isDetransform = false;

      if (
        input.transformTarget === "base" &&
        p.data.detransformTo &&
        p.data.detransformTo.length > 0
      ) {
        // De-transform to Base (prioritize explicit list over dynamic memory)
        nextTransformId =
          p.data.detransformTo[p.data.detransformTo.length - 1] || p.baseFormId;
        isDetransform = true;
      } else if (
        input.transformTarget === "base" &&
        (p.data.id === "gogeta" ||
          p.data.id === "gogeta_ssj" ||
          p.data.id === "gogeta_blue")
      ) {
        const isP1 = [engine.player1, ...engine.p1Team].includes(p);
        const wasFused = isP1 ? engine.p1FusionUsed : engine.p2FusionUsed;
        if (wasFused) {
          p.quickDashTimer = 0;
          p.state = PlayerState.DEFUSION;
          p.attackTimer = 999;
          p.comboStep = 0;
          p.animFinished = false;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.invincibleTimer = 60;
          p.ataque = false;
          p.comboType = "LIGHT";
          p.comboStep = 0;
          engine.particleManager.spawn("ENERGY", p.x, p.y, 10, "#ffffff", {
            speed: 5,
            size: 20,
          });
          return true;
        }
      } else if (p.data.transformTo && p.data.transformTo.length > 0) {
        if (p.ki >= 300) {
          if (input.transformTarget && input.transformTarget !== "base") {
            const tgt = input.transformTarget.toLowerCase();
            const synonyms: Record<string, string[]> = {
              ssj: ["ssj1", "ssj"],
              ssj2: ["ssj2"],
              ssj3: ["ssj3"],
              god: ["god"],
              ssb: ["blue", "ssb"],
              ui: ["ui", "instinct"],
              beast: ["beast"],
              ego: ["ego"],
            };
            const targets = synonyms[tgt] || [tgt];
            const matched = p.data.transformTo.find((id) => {
              const lowerId = id.toLowerCase();
              if (tgt === "ssj") {
                return (
                  lowerId.endsWith("ssj") ||
                  lowerId.includes("_ssj_") ||
                  lowerId === "ssj" ||
                  lowerId.includes("ssj1")
                );
              }
              return targets.some((t) => lowerId.includes(t));
            });
            if (matched) {
              nextTransformId = matched;
            } else {
              nextTransformId =
                input.up && p.data.transformTo.length > 1
                  ? p.data.transformTo[1]
                  : p.data.transformTo[0];
            }
          } else if (input.up && p.data.transformTo.length > 1) {
            nextTransformId = p.data.transformTo[1];
          } else {
            nextTransformId = p.data.transformTo[0];
          }
        }
      } else if (
        !input.down &&
        (!p.data.transformTo || p.data.transformTo.length === 0) &&
        p.data.detransformTo &&
        p.data.detransformTo.length > 0
      ) {
        // Auto-detransform to previous form
        nextTransformId = p.previousFormId || p.data.detransformTo[0];
        isDetransform = true;
      }

      if (nextTransformId) {
        if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.TRANSFORMACAO)) {
          return false;
        }
        const myTeamData = p === engine.player1 ? engine.p1Team : engine.p2Team;
        const hasCharacterInTeam =
          myTeamData.some((member) => member !== p && member.data.id === nextTransformId) ||
          p.data.id === nextTransformId;

        if (!hasCharacterInTeam) {
          p.quickDashTimer = 0;
          if (!isDetransform) {
            p.ki -= 300;
          }
          p.state = isDetransform
            ? PlayerState.DETRANSFORM
            : PlayerState.TRANSFORM;
          p.comboStep = 0;
          p.attackTimer = 999;
          p.animFinished = false;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.invincibleTimer = 60;
          p.ataque = false;
          p.comboType = "LIGHT";
          p.comboStep = 0;
          p.isTransformed =
            !isDetransform ||
            (nextTransformId !== p.baseFormId &&
              nextTransformId !== "goku_base_swl_removed" &&
              nextTransformId !== "goku_base_swl" &&
              nextTransformId !== "goku_base");
          p.isDetransforming = isDetransform;
          p.nextTransformId = nextTransformId;
          engine.particleManager.spawn(
            "AURA",
            p.x + p.width / 2,
            p.y + p.height / 2,
            50,
            isDetransform ? "#ffffff" : "#ffbb00",
            { size: 30, speed: 10 },
          );

          // Sparking Blast Shockwave
          const opp = p === engine.player1 ? engine.player2 : engine.player1;
          const dx = opp.x - p.x;
          const dist = Math.abs(dx);
          if (
            dist < 200 &&
            opp.state !== PlayerState.DEFEAT &&
            opp.state !== PlayerState.TAG_OUT &&
            opp.state !== PlayerState.ULTIMATE &&
            opp.invincibleTimer <= 0
          ) {
            opp.state = PlayerState.HIT;
            opp.stunTimer = 40;
            opp.ataque = false;
            opp.velocity.x = dx > 0 ? 15 : -15;
            opp.velocity.y = -10;
            opp.isGrounded = false;
            opp.takeDamage(10); // Small damage
            opp.ki = Math.min(MAX_KI, opp.ki + KI_GAIN_ON_DAMAGE);
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              true,
            );
          }
          return true;
        }
      }
    }

    const ultimatePressed =
      input.ultimate && (!prevInput || !prevInput.ultimate);
    const ultimate2Pressed =
      input.ultimate2 && (!prevInput || !prevInput.ultimate2);
    const ultimate3Pressed =
      input.ultimate3 && (!prevInput || !prevInput.ultimate3);
    const ultimate4Pressed =
      input.ultimate4 && (!prevInput || !prevInput.ultimate4);

    // Check if activating a Combined Ultimate (Ultimates combinados) which costs 5 bars (500 Ki)
    const isCombUlt = ultimate3Pressed && (p.data.id === "goku_black_rose" || p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base" || p.data.id === "kuririn");
    const requiredKi = isCombUlt ? 500 : 400;

    // For Teen Gohan SSJ2, both Ultimate 1 and Ultimate 2 triggers can start the 2-part Ultimate which needs 4 bars (400 KI)
    if (p.data.id === "teen_gohan_ssj2" && (ultimatePressed || ultimate2Pressed) && p.ki < 400) {
      return false;
    }

    if ((ultimatePressed || ultimate2Pressed || ultimate3Pressed || ultimate4Pressed) && p.ki >= requiredKi) {
      if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.ULTIMATE)) {
        return false;
      }
      if (p.data.id === "teen_gohan_ssj2") {
        p["fullKiUlt2"] = p.ki >= 700;
      } else {
        if (p.ki >= MAX_KI) {
          p["fullKiUlt2"] = true;
        } else {
          p["fullKiUlt2"] = false;
        }
      }

      // Check if executing near the boundary (borda do cenário) - if so, shift both players to the center of the map
      const opp = p === engine.player1 ? engine.player2 : engine.player1;
      const boundaryThreshold = 450; // Distance tolerance from the direct edges
      const nearLeft = p.pos.x - p.width / 2 < engine.physLimitLeft + boundaryThreshold || opp.pos.x - opp.width / 2 < engine.physLimitLeft + boundaryThreshold;
      const nearRight = p.pos.x + p.width / 2 > engine.physLimitRight - boundaryThreshold || opp.pos.x + opp.width / 2 > engine.physLimitRight - boundaryThreshold;
      
      if (nearLeft || nearRight) {
        const currentCenter = (p.pos.x + opp.pos.x) / 2;
        const targetCenter = engine.worldWidth / 2;
        const shiftX = targetCenter - currentCenter;
        
        // Shift both players perfectly keeping their relative distance
        p.pos.x += shiftX;
        opp.pos.x += shiftX;

        // Ensure both players remain inside play limits
        const minLeft = engine.physLimitLeft + 100;
        const maxRight = engine.physLimitRight - 100;

        if (p.pos.x < minLeft) p.pos.x = minLeft;
        if (p.pos.x > maxRight) p.pos.x = maxRight;
        if (opp.pos.x < minLeft) opp.pos.x = minLeft;
        if (opp.pos.x > maxRight) opp.pos.x = maxRight;
      }

      p.quickDashTimer = 0;
      p.ki -= requiredKi;
      p.state = PlayerState.ULTIMATE;

      // Track mission progress for human player
      if (p === engine.player1 && !engine.isP1Bot) {
        EventSystem.getInstance().publish("MISSION_ACTION", {
          action: "ULTIMATE_EXECUTE",
          amount: 1,
        });
      }

      p.ultPhase = 1;
      p.ultTimer = 0;
      p.ultType = 1;
      p["ultHitApplied"] = false;

      if (ultimate3Pressed && (p.data.id === "goku_black_rose" || p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base" || p.data.id === "kuririn")) {
        p.ultType = 3;
      } else if (ultimate4Pressed && p.data.id === "kuririn") {
        p.ultType = 4;
      } else if (ultimate2Pressed && p.data.id === "kuririn") {
        p.ultType = 2;
      } else if (ultimate2Pressed && p.data.id === "gogeta_ssj4") {
        p.ultType = 2;
      } else if (
        (p.data.id === "goku_ssj" ||
          p.data.id === "goku_base_swl_removed" ||
          p.data.id === "goku_base_swl" ||
          p.data.id === "goku_base" ||
          p.data.id === "gogeta_blue" ||
          p.data.id === "vegeta_base" ||
          p.data.id === "goku_mui" ||
          p.data.id === "trunks_ssj2" ||
          p.data.id === "vegeta_ego" ||
          p.data.id === "goku_blue_gif" ||
          p.data.id === "kuririn" ||
          p.data.id === "frieza_final" ||
          p.data.id === "broly_ikari" ||
          p.data.id === "goku_black_rose") &&
        ultimate2Pressed
      ) {
        p.ultType = 2; // Unlock and use Second Ultimate if using ult2 button
      }

      try {
        const playerNum = p === engine.player1 ? 1 : 2;
        const ultEvent = p.ultType === 3
          ? BattleEvent.ULTIMATE_3
          : (p.ultType === 4 ? BattleEvent.ULTIMATE : (p.ultType === 2 ? BattleEvent.ULTIMATE_2 : BattleEvent.ULTIMATE));
        BattleStateManager.getInstance().reportAction(p, opp, ultEvent, playerNum);
      } catch (e) {
        console.warn("[SPEECH_DIAL] Ultimate report fail:", e);
      }

      p.velocity.x = 0;
      p.velocity.y = 0;
      p.ataque = true;
      p.animFrame = 0;
      p.animTimer = 0;
      return true;
    }

    const tagPressed = input.tag && (!prevInput || !prevInput.tag);
    if (tagPressed) {
      // Normal tag if mostly idle or blocking
      if (
        p.state === PlayerState.IDLE ||
        p.state === PlayerState.RUNNING ||
        p.state === PlayerState.WALK_BACKWARD ||
        p.state === PlayerState.CROUCH ||
        p.state === PlayerState.BLOCKING ||
        p.state === PlayerState.BLOCKING_CROUCH
      ) {
        if (engine.tryTag(p, false)) return true;
      }
      // Tag cancel if attacking
      else if (
        p.state === PlayerState.ATTACKING ||
        p.state === PlayerState.JUMP_ATTACK ||
        p.state === PlayerState.CROUCH_ATTACK
      ) {
        if (engine.tryTag(p, true)) return true;
      }
    }

    const isCrouching =
      p.isGrounded &&
      (input.down ||
        p.state === PlayerState.CROUCH ||
        p.state === PlayerState.CROUCH_ATTACK);

    const isAttacking =
      p.state === PlayerState.ATTACKING ||
      p.state === PlayerState.JUMP_ATTACK ||
      p.state === PlayerState.CROUCH_ATTACK;
    const isRecovering = isAttacking && p.animFinished;
    const magicSeriesAllowed = isAttacking && p.hasHit;

    const isNeutral =
      !isAttacking &&
      (p.state === PlayerState.IDLE ||
        p.state === PlayerState.RUNNING ||
        p.state === PlayerState.DASHING ||
        p.state === PlayerState.DASH_START ||
        p.state === PlayerState.DASH_END ||
        p.state === PlayerState.QUICK_DASH ||
        p.state === PlayerState.WALK_BACKWARD ||
        p.state === PlayerState.JUMPING ||
        p.state === PlayerState.FALLING ||
        p.state === PlayerState.CROUCH);

    const canAttack = (isNeutral && (p.isGrounded || !p.airComboUsed)) || isRecovering || magicSeriesAllowed;

    const lightPressed =
      ((input.light || input.attack) &&
        (!prevInput || (!prevInput.light && !prevInput.attack))) ||
      p.queuedAttack === "LIGHT";
    const mediumPressed =
      (input.medium && (!prevInput || !prevInput.medium)) ||
      p.queuedAttack === "MEDIUM";
    const heavyPressed =
      (input.heavy && (!prevInput || !prevInput.heavy)) ||
      p.queuedAttack === "HEAVY";
    const kiblastPressed =
      (input.kiblast && (!prevInput || !prevInput.kiblast)) ||
      p.queuedAttack === "KI_BLAST";
    const specialPressed =
      (input.special && (!prevInput || !prevInput.special)) ||
      p.queuedAttack === "SPECIAL";
    const special2Pressed =
      (input.special2 && (!prevInput || !prevInput.special2)) ||
      p.queuedAttack === "SPECIAL_2";
    const special3Pressed =
      (input.special3 && (!prevInput || !prevInput.special3)) ||
      p.queuedAttack === "SPECIAL_3";
    const special4Pressed =
      (input.special4 && (!prevInput || !prevInput.special4)) ||
      p.queuedAttack === "SPECIAL_4";
    const special5Pressed =
      (input.special5 && (!prevInput || !prevInput.special5)) ||
      p.queuedAttack === "SPECIAL_5";
    const special6Pressed =
      (input.special6 && (!prevInput || !prevInput.special6)) ||
      p.queuedAttack === "SPECIAL_6";
    const special7Pressed =
      (input.special7 && (!prevInput || !prevInput.special7)) ||
      p.queuedAttack === "SPECIAL_7";
    const special8Pressed =
      (input.special8 && (!prevInput || !prevInput.special8)) ||
      p.queuedAttack === "SPECIAL_8";
    const special9Pressed =
      (input.special9 && (!prevInput || !prevInput.special9)) ||
      p.queuedAttack === "SPECIAL_9";
    const special10Pressed =
      (input.special10 && (!prevInput || !prevInput.special10)) ||
      p.queuedAttack === "SPECIAL_10";

    // Super Dash Auto-Activation during combo when opponent is out of reach
    const opp = p === engine.player1 ? engine.player2 : engine.player1;
    const dx = opp.x - p.x;
    const dy = opp.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isComboSequence = p.comboStep > 0 || p.comboWindow > 0 || isAttacking;

    if (
      isComboSequence &&
      dist > 120 &&
      !p.autoDashUsed &&
      !engine.cannotAct(p) &&
      (lightPressed || mediumPressed || heavyPressed)
    ) {
      p.state = PlayerState.SUPER_DASH;
      p.superDashActive = true;
      p.superDashPhase = 1;
      p.autoDashUsed = true;
      p.isGrounded = false;
      p.velocity.x = 0;
      p.velocity.y = -5;
      p.attackTimer = 15; // Phase 1 startup duration
      p.invincibleTimer = 0; // Phase 1: Vulnerable (no invincibility)
      p.rotation = 0; // Phase 1: No rotation applied
      p.comboWindow = 0;
      p.ataque = true;
      p.comboType = "SUPER_DASH";
      p.hasHit = false;
      p.jumpsUsed = 0;
      p.airDashUsed = false;
      p.airComboUsed = false;
      p.quickDashTimer = 0;
      p.queuedAttack = null;

      engine.particleManager.spawn(
        "AURA",
        p.x + p.width / 2,
        p.y + p.height / 2,
        10,
        p.data.color || "#ffffff",
        { size: 5, speed: 5 },
      );

      try {
        AudioManager.getInstance().playSFX("dash");
      } catch (e) {}

      return true;
    }

    if (canAttack) {
      if (
        kiblastPressed ||
        specialPressed ||
        special2Pressed ||
        special3Pressed ||
        special4Pressed ||
        special5Pressed ||
        special6Pressed ||
        special7Pressed ||
        special8Pressed ||
        special9Pressed ||
        special10Pressed ||
        heavyPressed ||
        mediumPressed ||
        lightPressed
      )
        p.queuedAttack = null;

      if (
        kiblastPressed ||
        specialPressed ||
        special2Pressed ||
        special3Pressed ||
        special4Pressed ||
        special5Pressed ||
        special6Pressed ||
        special7Pressed ||
        special8Pressed ||
        special9Pressed ||
        special10Pressed
      ) {
        if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.ESPECIAL)) {
          return false;
        }
      }

      if (heavyPressed || mediumPressed || lightPressed) {
        if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.ATAQUE_BASICO)) {
          return false;
        }
      }

      // Allow magic series escalation: Light -> Medium -> Heavy/Special
      if (special10Pressed) {
        engine.performAttack(p, "SPECIAL_10" as any, false);
        return true;
      }
      if (special9Pressed) {
        engine.performAttack(p, "SPECIAL_9" as any, false);
        return true;
      }
      if (special8Pressed) {
        engine.performAttack(p, "SPECIAL_8" as any, false);
        return true;
      }
      if (special7Pressed) {
        engine.performAttack(p, "SPECIAL_7" as any, false);
        return true;
      }
      if (special6Pressed) {
        engine.performAttack(p, "SPECIAL_6", false);
        return true;
      }
      if (special5Pressed) {
        engine.performAttack(p, "SPECIAL_5", false);
        return true;
      }
      if (special4Pressed) {
        engine.performAttack(p, "SPECIAL_4", false);
        return true;
      }
      if (special3Pressed) {
        engine.performAttack(p, "SPECIAL_3", false);
        return true;
      }
      if (special2Pressed) {
        engine.performAttack(p, "SPECIAL_2", false);
        return true;
      }
      if (specialPressed) {
        engine.performAttack(p, "SPECIAL", false);
        return true;
      }
      if (kiblastPressed) {
        engine.performAttack(p, "KI_BLAST", false);
        return true;
      }
      const curIsLight = p.comboType === "LIGHT";
      const curIsMedium = p.comboType === "MEDIUM";
      const curIsHeavy = p.comboType === "HEAVY";

      if (
        heavyPressed &&
        p.heavyCooldownTimer <= 0 &&
        (!isAttacking || curIsLight || curIsMedium || curIsHeavy)
      ) {
        p.heavyCooldownTimer = 90; // 1.5 seconds cooldown at 60fps
        engine.performAttack(p, "HEAVY", isCrouching);
        return true;
      }
      if (mediumPressed && (!isAttacking || curIsLight || curIsMedium)) {
        engine.performAttack(p, "MEDIUM", isCrouching);
        return true;
      }
      if (lightPressed && (!isAttacking || curIsLight)) {
        engine.performAttack(p, "LIGHT", isCrouching);
        return true;
      }
    }

    if (isAttacking) {
      if (p.hasHit && input.jump) {
        return false; // Yield to handleMovementInputs to execute a Jump Cancel
      }
      return true;
    }
    return false;
  }
}
