import { CharacterBeamOverrides } from "../../types";

export const GokuBlackRose_Beams: Record<string, CharacterBeamOverrides> = {
    "BEAM": {
        start: {
            offsetX: -119,
            offsetY: -187,
            scale: 2.2,
            originX: 110,
            originY: 222,
            centerX: -8,
            centerY: 120
        },
        middle: {
            offsetX: 0,
            offsetY: 23,
            scale: 2.2,
            kiOriginX: 61,
            centerX: -2,
            centerY: 116,
            projectileOffsetX: -244,
            projectileWidth: 305,
            projectileOffsetY: -124,
            projectileHeight: -249
        },
        end: {
            offsetX: 0,
            offsetY: 49,
            scale: 2.2,
            centerY: 172,
            centerX: 298
        }
    },
    "CHAVE_BEAM_005": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/1/1.gif",
            "frames": 2,
            "frameWidth": 81,
            "frameHeight": 99,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -119,
            "offsetY": -211,
            "originX": 110,
            "originY": 222,
            "centerX": -8,
            "centerY": 120,
            "scale": 2.2,
            "beamSpacing": -2
        },
        "middle": {
            "imageUrl": "/Assets/especiais/beans/1/2.gif",
            "frames": 1,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": 1,
            "kiOriginX": 61,
            "centerX": -2,
            "centerY": 116,
            "projectileOffsetX": -244,
            "projectileWidth": 305,
            "projectileOffsetY": -124,
            "projectileHeight": -249,
            "scale": 2.2,
            "beamSpacing": -2
        },
        "end": {
            "imageUrl": "/Assets/especiais/beans/1/3.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": 56,
            "centerY": 172,
            "centerX": 298,
            "fullScreen": false,
            "scale": 2.2,
            "beamSpacing": -2
        }
    }
};
