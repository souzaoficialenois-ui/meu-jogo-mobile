import { CharacterBeamOverrides } from "../../types";

export const GogetaBlue_Beams: Record<string, CharacterBeamOverrides> = {
    // Left empty until user fills it, matching previous logic
    "BEAM": {
        start: {},
        middle: { offsetX: 0 },
        end: { offsetX: 0 }
    },
    "BEAM_3": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/3/1.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -76,
            "offsetY": -207,
            "kiOriginX": 47,
            "kiOriginY": 10,
            "centerY": 24,
            "centerX": 0
        },
        "middle": {
            "imageUrl": "/Assets/especiais/beans/3/2.gif",
            "frames": 1,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": -2,
            "kiOriginX": 47,
            "kiOriginY": 10,
            "centerX": 330,
            "centerY": 367,
            "projectileOffsetX": -244,
            "projectileOffsetY": -124,
            "projectileWidth": 305,
            "projectileHeight": -249
        },
        "end": {
            "imageUrl": "/Assets/especiais/beans/3/3.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": 41,
            "centerY": 219,
            "centerX": 0
        }
    },
    "CHAVE_BEAM_46": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/7/1.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -110,
            "offsetY": -328,
            "originX": 110,
            "originY": 222,
            "centerX": -8,
            "centerY": 120,
            "scale": 3.8,
            "beamSpacing": -32
        },
        "middle": {
            "imageUrl": "/Assets/especiais/beans/7/2.gif",
            "frames": 1,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": -19,
            "kiOriginX": 61,
            "centerX": -2,
            "centerY": 116,
            "projectileOffsetX": -244,
            "projectileWidth": 305,
            "projectileOffsetY": -124,
            "projectileHeight": -249,
            "scale": 3.8,
            "beamSpacing": -32
        },
        "end": {
            "offsetX": 0,
            "imageUrl": "/Assets/especiais/beans/7/3.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetY": -88,
            "centerY": 172,
            "centerX": 298,
            "scale": 3.8,
            "beamSpacing": -32
        }
    }
};
