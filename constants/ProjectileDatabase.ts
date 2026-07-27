import { AnimationFrameData } from "../types";

export interface ProjectileFamily {
  id: string;
  name: string;
  color?: string;
  middle: AnimationFrameData;
  behavior?: "STRAIGHT" | "HOMING" | "TARGET_POS" | "GROWING_STRAIGHT";
  maxScale?: number;

  // Personalização Visual de projeteis
  projectileOpacity?: number;
  projectileBrightness?: number;
  projectileHueRotate?: number;
  projectileSaturate?: number;
  projectileContrast?: number;
}

export const PROJECTILE_DATABASE: Record<string, ProjectileFamily> = {
  "PROJETIL_1": {
    "id": "PROJETIL_1",
    "name": "Projetil 1",
    "color": "#00d2ff",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/1/1.png",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_2": {
    "id": "PROJETIL_2",
    "name": "Projetil 2",
    "color": "#eab308",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/2/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_3": {
    "id": "PROJETIL_3",
    "name": "Projetil 3",
    "color": "#ef4444",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/3/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_4": {
    "id": "PROJETIL_4",
    "name": "Projetil 4",
    "color": "#3b82f6",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/4/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_5": {
    "id": "PROJETIL_5",
    "name": "Projetil 5",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/5/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileHueRotate": 187,
    "projectileBrightness": 1,
    "projectileOpacity": 1,
    "projectileSaturate": 3,
    "projectileContrast": 1.5,
  },
  "KI_BLAST_GIGANTE": {
    "id": "KI_BLAST_GIGANTE",
    "name": "Ki Blast Gigante",
    "color": "#ffffff",
    "behavior": "STRAIGHT",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/12/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 4,
      "scale": 3.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_1": {
    "id": "fechosenergia_1",
    "name": "Fecho de Energia 1",
    "color": "#3b82f6",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/1/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_2": {
    "id": "fechosenergia_2",
    "name": "Fecho de Energia 2",
    "color": "#22c55e",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/2/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_3": {
    "id": "fechosenergia_3",
    "name": "Fecho de Energia 3",
    "color": "#f59e0b",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/3/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_4": {
    "id": "fechosenergia_4",
    "name": "Fecho de Energia 4",
    "color": "#ec4899",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/4/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_5": {
    "id": "fechosenergia_5",
    "name": "Fecho de Energia 5",
    "color": "#a855f7",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/5/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_6": {
    "id": "fechosenergia_6",
    "name": "Fecho de Energia 6",
    "color": "#ef4444",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/6/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_7": {
    "id": "fechosenergia_7",
    "name": "Fecho de Energia 7",
    "color": "#eab308",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/7/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_8": {
    "id": "fechosenergia_8",
    "name": "Fecho de Energia 8",
    "color": "#06b6d4",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/8/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_9": {
    "id": "fechosenergia_9",
    "name": "Fecho de Energia 9",
    "color": "#6366f1",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/9/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "fechosenergia_10": {
    "id": "fechosenergia_10",
    "name": "Fecho de Energia 10",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/10/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileBrightness": 1,
    "projectileOpacity": 1,
    "projectileHueRotate": 0,
    "projectileSaturate": 1,
    "projectileContrast": 1,
  },
  "fechosenergia_11": {
    "id": "fechosenergia_11",
    "name": "Fecho de Energia 11",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/11/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.2,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_1": {
    "id": "GENKIDAMA_1",
    "name": "Genkidama 1",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/1/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 3,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileBrightness": 1,
    "projectileOpacity": 1,
    "projectileHueRotate": 0,
    "projectileSaturate": 1,
    "projectileContrast": 1,
  },
  "GENKIDAMA_1_GROUND": {
    "id": "GENKIDAMA_1_GROUND",
    "name": "Genkidama 1 Ground",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/1/2.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.75,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_1_EXPLODE": {
    "id": "GENKIDAMA_1_EXPLODE",
    "name": "Genkidama 1 Explode",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/1/3.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.75,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_2": {
    "id": "GENKIDAMA_2",
    "name": "Genkidama 2",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/2/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 3.0,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_2_GROUND": {
    "id": "GENKIDAMA_2_GROUND",
    "name": "Genkidama 2 Ground",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/2/2.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.75,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_2_EXPLODE": {
    "id": "GENKIDAMA_2_EXPLODE",
    "name": "Genkidama 2 Explode",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/2/3.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.75,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "GENKIDAMA_3": {
    "id": "GENKIDAMA_3",
    "name": "Genkidama 3",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 3.0,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileOpacity": 1,
    "projectileBrightness": 1,
  },
  "GENKIDAMA_3_EXPLODE": {
    "id": "GENKIDAMA_3_EXPLODE",
    "name": "Genkidama 3 Explode",
    "color": "#00d2ff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/2.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.75,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_6": {
    "id": "PROJETIL_6",
    "name": "Projetil 6",
    "color": "#10b981",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/6/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_7": {
    "id": "PROJETIL_7",
    "name": "Projetil 7",
    "color": "#ffffff",
    "behavior": "GROWING_STRAIGHT",
    "maxScale": 4.2,
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/7/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_8": {
    "id": "PROJETIL_8",
    "name": "Projetil 8",
    "color": "#ffffff",
    "behavior": "GROWING_STRAIGHT",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/8/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_9": {
    "id": "PROJETIL_9",
    "name": "Projetil 9",
    "color": "#a855f7",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/9/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_10": {
    "id": "PROJETIL_10",
    "name": "Projetil 10",
    "color": "#ec4899",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/10/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_11": {
    "id": "PROJETIL_11",
    "name": "Projetil 11",
    "color": "#f97316",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/11/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_12": {
    "id": "PROJETIL_12",
    "name": "Projetil 12",
    "color": "#06b6d4",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/12/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_13": {
    "id": "PROJETIL_13",
    "name": "Projetil 13",
    "color": "#eab308",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/13/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_14": {
    "id": "PROJETIL_14",
    "name": "Projetil 14",
    "color": "#ef4444",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/14/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_15": {
    "id": "PROJETIL_15",
    "name": "Projetil 15",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/15/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "PROJETIL_16": {
    "id": "PROJETIL_16",
    "name": "Projetil 16",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/16/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "CHAVE_PROJETIL_17": {
    "id": "CHAVE_PROJETIL_17",
    "name": "Projetil 5",
    "color": "#ffffff",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/projeteis/5/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.5,
      "offsetX": 108,
      "offsetY": 130,
      "isGif": true
    },
    "projectileHueRotate": 241,
    "projectileBrightness": 1,
    "projectileOpacity": 1,
    "projectileSaturate": 3,
    "projectileContrast": 1.5,
  },
  "CHAVE_GENKIDAMA_4": {
    "id": "CHAVE_GENKIDAMA_4",
    "name": "Genkidama Exclusiva",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/1/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.0,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileOpacity": 1,
    "projectileBrightness": 1,
  },
  "CHAVE_GENKIDAMA_4_EXPLODE": {
    "id": "CHAVE_GENKIDAMA_4_EXPLODE",
    "name": "Genkidama Exclusiva Explode",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/1/3.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "CHAVE_GENKIDAMA_5": {
    "id": "CHAVE_GENKIDAMA_5",
    "name": "Super Nova Freeza",
    "color": "#a855f7",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1.0,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileOpacity": 1,
    "projectileBrightness": 1,
  },
  "CHAVE_GENKIDAMA_5_EXPLODE": {
    "id": "CHAVE_GENKIDAMA_5_EXPLODE",
    "name": "Super Nova Freeza Explode",
    "color": "#a855f7",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/2.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.5,
      "offsetX": 0,
      "offsetY": 0
    }
  },
  "CHAVE_FECHO_12": {
    "id": "CHAVE_FECHO_12",
    "name": "Fecho de Energia 7",
    "color": "#eab308",
    "middle": {
      "imageUrl": "/Assets/especiais/fechosenergia/7/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2,
      "offsetX": 0,
      "offsetY": 147
    }
  },
  "CHAVE_GENKIDAMA_7": {
    "id": "CHAVE_GENKIDAMA_7",
    "name": "Genkidama Broly Ikari",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/1.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 1,
      "offsetX": 0,
      "offsetY": 0
    },
    "projectileOpacity": 1,
    "projectileBrightness": 1,
    "projectileHueRotate": 164
  },
  "CHAVE_GENKIDAMA_7_EXPLODE": {
    "id": "CHAVE_GENKIDAMA_7_EXPLODE",
    "name": "Genkidama Broly Ikari Explode",
    "color": "#ffffff",
    "behavior": "TARGET_POS",
    "middle": {
      "imageUrl": "/Assets/especiais/bolasenergia/genkidamas/3/2.gif",
      "frames": 1,
      "frameWidth": 0,
      "frameHeight": 0,
      "speed": 5,
      "scale": 2.5,
      "offsetX": 0,
      "offsetY": 0
    }
  }
};
