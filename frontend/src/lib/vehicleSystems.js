const SEVERITY = { ok: 0, warning: 1, error: 2 };
const LEVELS = ['ok', 'warning', 'error'];

// Overall level = worst system state. Driving is blocked when a system marked
// "blocksDriving" in vehicle-systems.json reports an error.
export function systemsSummary(systems, states) {
  let worst = 0;
  const blockedBy = [];
  for (const sys of systems) {
    const state = states[sys.id] ?? 'ok';
    worst = Math.max(worst, SEVERITY[state]);
    if (state === 'error' && sys.blocksDriving) blockedBy.push(sys.label);
  }
  return { level: LEVELS[worst], drivingBlocked: blockedBy.length > 0, blockedBy };
}

export const STATUS_LEVELS = LEVELS;
