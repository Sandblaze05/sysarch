export const IDLE_SETTLE_DELAY_MS = 10000;
export const MOTION_EASE = 0.075;
export const VIDEO_SCALE = 1.06;
export const X_OFFSET_PX = 12;
export const Y_OFFSET_PX = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getPointerTarget(clientX, clientY, rect) {
  if (!rect.width || !rect.height) {
    return { x: 0, y: 0 };
  }

  return {
    x: clamp(((clientX - rect.left) / rect.width - 0.5) * 2, -1, 1),
    y: clamp(((clientY - rect.top) / rect.height - 0.5) * 2, -1, 1),
  };
}

export function easeToward(current, target, ease = MOTION_EASE) {
  return current + (target - current) * ease;
}

export function getVideoTransform(x, y) {
  const tx = Number((-x * X_OFFSET_PX).toFixed(3));
  const ty = Number((-y * Y_OFFSET_PX).toFixed(3));

  return `scale(${VIDEO_SCALE}) translate3d(${tx}px, ${ty}px, 0)`;
}

export function getVideoFilter(isActive) {
  return isActive ? "saturate(1.08) contrast(1.06)" : "saturate(1.02) contrast(1.04)";
}
