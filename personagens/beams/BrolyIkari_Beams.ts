import { CharacterBeamOverrides } from "../../types";

export const BrolyIkari_Beams: Record<string, CharacterBeamOverrides> = {
    "CHAVE_BEAM_42": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/1/1.gif",
            "frames": 2,
            "frameWidth": 81,
            "frameHeight": 99,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -109,
            "offsetY": -211,
            "originX": 110,
            "originY": 222,
            "centerX": -8,
            "centerY": 120,
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
            "beamSpacing": -2
        }
    },
    "CHAVE_PROJETIL_17": {
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
        }
    }
};
