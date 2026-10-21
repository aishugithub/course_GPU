// ============================================================
//  GUEST PROGRESS — localStorage only, no backend involved.
//  Used when someone is exploring Foothold without an account.
//  Scoped per courseId so this file works even if course.config.js
//  ever points at a different courseId later.
// ============================================================

const STORAGE_KEY = 'foothold_guest_progress_v1';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getGuestProgress(courseId) {
  const all = readAll();
  return all[courseId] || [];
}

export function saveGuestProgress(courseId, unitId) {
  try {
    const all = readAll();
    const done = new Set(all[courseId] || []);
    done.add(unitId);
    all[courseId] = [...done];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage can fail (private browsing, quota, etc.) --
    // guest progress is a nice-to-have, never worth crashing over.
  }
}
