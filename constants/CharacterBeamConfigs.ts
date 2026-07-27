import { AnimationFrameData } from "../types";

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface CharacterBeamOverrides {
    name?: string;
    rotation?: number;
    start?: Partial<AnimationFrameData>;
    middle?: Partial<AnimationFrameData>;
    end?: Partial<AnimationFrameData>;
    // Customização Visual do Beam para o personagem
    color?: string;
    beamOpacity?: number;
    beamBrightness?: number;
    beamHueRotate?: number;
    beamSaturate?: number;
    beamContrast?: number;
}

export const CHARACTER_BEAM_CONFIGS: Record<string, Record<string, CharacterBeamOverrides>> = {
    "goku_base_swl": {
        "BEAM": {
            start: {
                offsetX: 3,
                offsetY: -105,
                scale: 2.2,
                originX: 110,
                originY: 222,
                centerX: 91,
                centerY: 110
            },
            middle: {
                offsetX: 0,
                offsetY: 115,
                scale: 2.2,
                kiOriginX: 61,
                centerX: -19,
                centerY: 107
            },
            end: {
                offsetX: 0,
                offsetY: 141,
                scale: 2.2,
                centerY: 172,
                centerX: 298
            }
        }
    },
    "goku_base_swl_removed": {
        "BEAM": {
            start: {
                offsetX: 3,
                offsetY: -105,
                scale: 2.2,
                originX: 110,
                originY: 222,
                centerX: 91,
                centerY: 110
            },
            middle: {
                offsetX: 0,
                offsetY: 115,
                scale: 2.2,
                kiOriginX: 61,
                centerX: -19,
                centerY: 107
            },
            end: {
                offsetX: 0,
                offsetY: 141,
                scale: 2.2,
                centerY: 172,
                centerX: 298
            }
        }
    },
    "gogeta_blue": {
        "BEAM": {
            start: {
                // Here we can place default original overrides for Gogeta Blue's BEAM if needed
                // Currently just empty, will use base BEAM config until configured by user
            },
            middle: {
                offsetX: 0,
                
            },
            end: {
                offsetX: 0,
                
            }
        }
    }
};
