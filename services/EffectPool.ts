import { VisualEffect } from "../types";

/**
 * EffectPool
 * Gerencia o pooling (reutilização de memória) de efeitos visuais de impacto.
 * Evita a alocação constante de novos objetos no heap e garante a limpeza
 * imediata da memória quando a animação do efeito é concluída.
 */
export class EffectPool {
  private static instance: EffectPool;
  private pool: VisualEffect[] = [];
  private activeEffects: Set<VisualEffect> = new Set();
  private maxPoolSize: number = 40;

  private constructor() {}

  public static getInstance(): EffectPool {
    if (!EffectPool.instance) {
      EffectPool.instance = new EffectPool();
    }
    return EffectPool.instance;
  }

  /**
   * Obtém um objeto VisualEffect do pool (reutilizado) ou cria um novo se o pool estiver vazio.
   */
  public acquire(params: {
    id: number;
    x: number;
    y: number;
    imageUrl: string;
    frames: number;
    loop?: boolean;
    scale?: number;
    facingRight?: boolean;
    ownerId?: "p1" | "p2" | string;
    type?: string;
    configKey?: string;
    animSpeed?: number;
    frameWidth?: number;
    frameHeight?: number;
    isGif?: boolean;
    layer?: 'FRONT' | 'BACK';
    fullScreen?: boolean;
  }): VisualEffect {
    let effect: VisualEffect;

    if (this.pool.length > 0) {
      effect = this.pool.pop()!;
    } else {
      effect = {
        id: 0,
        x: 0,
        y: 0,
        imageUrl: "",
        frames: 1,
        animFrame: 0,
        animTimer: 0,
        loop: false,
        scale: 1,
        facingRight: true,
        active: true,
      };
    }

    // Reinicializa todas as propriedades de forma limpa
    effect.id = params.id;
    effect.x = params.x;
    effect.y = params.y;
    effect.imageUrl = params.imageUrl;
    effect.frames = params.frames;
    effect.animFrame = 0;
    effect.animTimer = 0;
    effect.animSpeed = params.animSpeed ?? 4;
    effect.frameWidth = params.frameWidth;
    effect.frameHeight = params.frameHeight;
    effect.isGif = params.isGif;
    effect.loop = params.loop ?? false;
    effect.scale = params.scale ?? 1;
    effect.facingRight = params.facingRight ?? true;
    effect.active = true;
    effect.ownerId = params.ownerId as any;
    effect.type = params.type as any;
    effect.configKey = params.configKey;
    effect.fullScreen = params.fullScreen ?? false;
    effect.layer = params.layer;

    // Limpa propriedades dinâmicas anteriores
    delete (effect as any)._finishedBuffer;
    delete (effect as any).lastHitFrame;
    delete (effect as any).rotation;
    delete (effect as any).alpha;
    delete (effect as any).vy;
    delete (effect as any).offsetY;
    delete (effect as any).offsetX;

    this.activeEffects.add(effect);
    return effect;
  }

  /**
   * Devolve um efeito ao pool assim que sua animação é concluída ou desativada,
   * removendo referências e disponibilizando a instância para reutilização.
   */
  public release(effect: VisualEffect): void {
    if (!effect) return;

    effect.active = false;
    this.activeEffects.delete(effect);

    // Limpa referências internas para evitar vazamentos de memória
    delete (effect as any)._finishedBuffer;
    delete (effect as any).lastHitFrame;

    if (this.pool.length < this.maxPoolSize && !this.pool.includes(effect)) {
      this.pool.push(effect);
    }
  }

  /**
   * Desativa e recicla imediatamente todos os efeitos de impacto ativos na cena.
   */
  public recycleActiveImpactEffects(effects: VisualEffect[]): void {
    for (let i = 0; i < effects.length; i++) {
      const eff = effects[i];
      if (
        eff.active && (
          eff.type === "COMBO_HIT" ||
          eff.type === "COMBO_HIT_MEDIUM" ||
          eff.type === "COMBO_HIT_HEAVY" ||
          eff.type === "COMBO_HIT_BEANS" ||
          eff.type === "DEFESA_QUEBRADA"
        )
      ) {
        this.release(eff);
      }
    }
  }

  /**
   * Retorna a quantidade de objetos atualmente armazenados no pool livres para uso.
   */
  public getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Esvazia completamente o pool e libera todos os objetos de efeito da memória.
   */
  public clear(): void {
    this.pool = [];
    this.activeEffects.clear();
  }
}
