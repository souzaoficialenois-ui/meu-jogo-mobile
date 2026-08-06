import { CharacterBeamOverrides } from "../../types";

export const GokuBase_Beams: Record<string, CharacterBeamOverrides> = {
    "CHAVE_BEAM_002": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/1/1.gif",
            "frames": 2,
            "frameWidth": 81,
            "frameHeight": 99,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -112,
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
            "offsetX": -4,
            "offsetY": 8,
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
        },
        "color": "#ffffff",
        "name": "Beam 1"
    },
    "CHAVE_BEAM_001": {
        "start": {
            "imageUrl": "/Assets/especiais/beans/7/1.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -110,
            "offsetY": -298,
            "originX": 110,
            "originY": 222,
            "centerX": -8,
            "centerY": 120,
            "scale": 3.25,
            "beamSpacing": -23
        },
        "middle": {
            "imageUrl": "/Assets/especiais/beans/7/2.gif",
            "frames": 1,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": -2,
            "offsetY": 1,
            "kiOriginX": 61,
            "centerX": -2,
            "centerY": 116,
            "projectileOffsetX": -244,
            "projectileWidth": 305,
            "projectileOffsetY": -124,
            "projectileHeight": -249,
            "scale": 3.25,
            "beamSpacing": -23
        },
        "end": {
            "imageUrl": "/Assets/especiais/beans/7/3.gif",
            "frames": 2,
            "frameWidth": 0,
            "frameHeight": 0,
            "isGif": true,
            "speed": 4,
            "loop": true,
            "offsetX": 0,
            "offsetY": -52,
            "centerY": 172,
            "centerX": 298,
            "fullScreen": false,
            "scale": 3.25,
            "beamSpacing": -23
        }
    }
};

// Apply dynamic URL localization for Goku Base beams
Object.keys(GokuBase_Beams).forEach(key => {
  const beam = GokuBase_Beams[key];
  if (beam.start && typeof beam.start.imageUrl === "string" && beam.start.imageUrl.includes("f24276d3833c691d9074bd8103a8a391abace974")) {
    beam.start.imageUrl = beam.start.imageUrl.replace("f24276d3833c691d9074bd8103a8a391abace974", "7c648170d12044bb6ec5ecf68699944a4abea6fa");
  }
  if (beam.middle && typeof beam.middle.imageUrl === "string" && beam.middle.imageUrl.includes("f24276d3833c691d9074bd8103a8a391abace974")) {
    beam.middle.imageUrl = beam.middle.imageUrl.replace("f24276d3833c691d9074bd8103a8a391abace974", "7c648170d12044bb6ec5ecf68699944a4abea6fa");
  }
  if (beam.end && typeof beam.end.imageUrl === "string" && beam.end.imageUrl.includes("f24276d3833c691d9074bd8103a8a391abace974")) {
    beam.end.imageUrl = beam.end.imageUrl.replace("f24276d3833c691d9074bd8103a8a391abace974", "7c648170d12044bb6ec5ecf68699944a4abea6fa");
  }
});
