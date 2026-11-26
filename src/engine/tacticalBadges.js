/**
 * Tactical Piece Identification System for Wizard Chess 3D
 * Provides high-contrast, color-coded pedestal rings and floating billboard crests
 * to make every piece unmistakably distinct from ANY camera angle (overhead, side, or perspective).
 */

export const PIECE_TACTICAL_CONFIG = {
  king: {
    symbol: '♔',
    letter: 'K',
    label: 'King',
    color: 0xffd700,
    cssColor: '#ffd700',
    emissive: 0xffaa00,
    ringRadius: 0.36,
    ringTube: 0.040,
    badgeYOffset: 0.28
  },
  queen: {
    symbol: '♕',
    letter: 'Q',
    label: 'Queen',
    color: 0xc850f0,
    cssColor: '#c850f0',
    emissive: 0xaa20d0,
    ringRadius: 0.35,
    ringTube: 0.038,
    badgeYOffset: 0.26
  },
  rook: {
    symbol: '♖',
    letter: 'R',
    label: 'Rook',
    color: 0xff8800,
    cssColor: '#ff8800',
    emissive: 0xdd5500,
    ringRadius: 0.34,
    ringTube: 0.036,
    badgeYOffset: 0.24
  },
  bishop: {
    symbol: '♗',
    letter: 'B',
    label: 'Bishop',
    color: 0x00c8ff,
    cssColor: '#00c8ff',
    emissive: 0x0088dd,
    ringRadius: 0.33,
    ringTube: 0.035,
    badgeYOffset: 0.25
  },
  knight: {
    symbol: '♘',
    letter: 'N',
    label: 'Knight',
    color: 0x00e575,
    cssColor: '#00e575',
    emissive: 0x00aa44,
    ringRadius: 0.33,
    ringTube: 0.035,
    badgeYOffset: 0.24
  },
  pawn: {
    symbol: '♙',
    letter: 'P',
    label: 'Pawn',
    color: 0xd8e4f0,
    cssColor: '#d8e4f0',
    emissive: 0x88a0b8,
    ringRadius: 0.30,
    ringTube: 0.030,
    badgeYOffset: 0.20
  }
};

/**
 * Creates an emissive pedestal torus ring encircling the piece base.
 * Visible from above, diagonal, and side profiles.
 */
export function createPieceTacticalRing(type, THREE) {
  const cfg = PIECE_TACTICAL_CONFIG[type] || PIECE_TACTICAL_CONFIG.pawn;
  const ringGeo = new THREE.TorusGeometry(cfg.ringRadius, cfg.ringTube, 14, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: cfg.emissive,
    emissiveIntensity: 0.95,
    roughness: 0.22,
    metalness: 0.75
  });
  const mesh = new THREE.Mesh(ringGeo, ringMat);
  mesh.name = 'tacticalBaseRing';
  mesh.position.y = 0.015;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

/**
 * Creates a billboarded tactical crest sprite that hovers directly above the piece crown.
 */
export function createPieceTacticalSprite(type, color, THREE) {
  const cfg = PIECE_TACTICAL_CONFIG[type] || PIECE_TACTICAL_CONFIG.pawn;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background medallion with metallic bevel
  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(64, 45, 10, 64, 64, 54);
  if (color === 'w') {
    grad.addColorStop(0, 'rgba(40, 50, 70, 0.96)');
    grad.addColorStop(1, 'rgba(12, 16, 26, 0.94)');
  } else {
    grad.addColorStop(0, 'rgba(45, 25, 45, 0.96)');
    grad.addColorStop(1, 'rgba(18, 12, 22, 0.94)');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer border with piece type color
  ctx.lineWidth = 5;
  ctx.strokeStyle = cfg.cssColor;
  ctx.shadowColor = cfg.cssColor;
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Subtle inner accent rim
  ctx.beginPath();
  ctx.arc(64, 64, 45, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Chess glyph
  ctx.fillStyle = cfg.cssColor;
  ctx.font = 'bold 56px "Segoe UI Symbol", "Apple Color Emoji", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = cfg.cssColor;
  ctx.shadowBlur = 8;
  ctx.fillText(cfg.symbol, 64, 58);

  // Letter abbreviation badge
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px "Inter", -apple-system, sans-serif';
  ctx.fillText(cfg.letter, 64, 96);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.name = 'tacticalBadge';
  sprite.scale.set(0.60, 0.60, 1.0);
  return sprite;
}
