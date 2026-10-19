// Driver inputs can come from the keyboard/touch controls ("local") or from an
// external device such as the CARLA team's real steering wheel. This module is
// the contract between the two: it validates external messages and merges them
// with local input. See docs/INTEGRATION.md for the message format.

const GEARS = ['P', 'R', 'N', 'D'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Accepts one decoded JSON message from the wheel. Returns only the valid fields
// (all optional), or null if the message is not a controls message.
//   steeringDeg  absolute wheel angle in degrees (negative = left)
//   steering     normalised -1..1, scaled to the vehicle's max steering lock
//   throttle     0..1     brake  0..1     gear  "P" | "R" | "N" | "D"
export function parseControlMessage(message, maxSteeringDeg) {
  if (!message || typeof message !== 'object' || message.type !== 'controls') return null;
  const out = {};
  if (isNum(message.steeringDeg)) out.steeringDeg = clamp(message.steeringDeg, -maxSteeringDeg, maxSteeringDeg);
  else if (isNum(message.steering)) out.steeringDeg = clamp(message.steering, -1, 1) * maxSteeringDeg;
  if (isNum(message.throttle)) out.throttle = clamp(message.throttle, 0, 1);
  if (isNum(message.brake)) out.brake = clamp(message.brake, 0, 1);
  if (typeof message.gear === 'string' && GEARS.includes(message.gear.toUpperCase()))
    out.gear = message.gear.toUpperCase();
  return out;
}

// External input only counts while it is fresh. If the wheel stops sending
// (cable pulled, bridge crashed) its throttle must not stay applied.
export function isExternalFresh(external, nowMs, staleMs) {
  return Boolean(external && external.receivedAt !== undefined && nowMs - external.receivedAt <= staleMs);
}

// Local input: { accel, brake, left, right } as booleans (keys / held pedals).
// Result: pedal targets 0..1, and either an absolute steering angle (external)
// or left/right for rate-based steering (local).
export function mergeInputs(local, external) {
  const ext = external?.controls ?? {};
  const merged = {
    accel: Math.max(local.accel ? 1 : 0, ext.throttle ?? 0),
    brake: Math.max(local.brake ? 1 : 0, ext.brake ?? 0),
    left: Boolean(local.left),
    right: Boolean(local.right),
  };
  if (ext.steeringDeg !== undefined) merged.steeringDeg = ext.steeringDeg;
  // Real pedals report a position, so they are followed directly (no ramp).
  merged.analogPedals = ext.throttle !== undefined || ext.brake !== undefined;
  return merged;
}
