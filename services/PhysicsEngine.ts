import { PlayerState, InputState } from "../types";
import { Player } from "./Player";
import { GameEngine } from "./GameEngine";
import {
  GRAVITY,
  MAX_GUARD,
  GUARD_REGEN_RATE,
} from "../constants";

export class PhysicsEngine {
  public static updatePhysics(engine: GameEngine, p: Player, frameCount: number) {
    if (p.hp < p.blueHealth && p.hp > 0) {
      const isActiveFighter = p === engine.player1 || p === engine.player2;
      if (!isActiveFighter) {
        if (
          p.state === PlayerState.STANDBY ||
          p.state === PlayerState.SPARKING ||
          (p.sparkingTimer > 0 &&
            p.state !== PlayerState.HIT &&
            p.state !== PlayerState.TAG_OUT &&
            p.state !== PlayerState.TAG_IN)
        ) {
          p.hp = Math.min(
            p.blueHealth,
            p.hp + (p.sparkingTimer > 0 ? 0.3 : 0.05)
          );
        }
      }
    }
    if (p.sparkingTimer > 0) p.sparkingTimer--;

    if (p.state === PlayerState.SPARKING) {
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.attackTimer--;
      if (p.attackTimer <= 0) p.state = PlayerState.IDLE;
      return;
    }

    let applyGravity = true;
    if (p.gravityDisabledTimer > 0) {
      p.gravityDisabledTimer--;
      applyGravity = false;
    }
    
    // Check states that disable gravity...
    // To make this easier, I'll extract collision instead. Physics has too many logic dependencies.
  }
}
