// ============================================================
//  ANALYTICS.JS — minimal, fire-and-forget usage tracking.
//  Logs to the same Google Sheets backend as everything else
//  (see Code.gs: handleLogEvent -> 'Events' tab, auto-created).
//
//  IMPORTANT: logEvent() is never awaited by its callers. A slow
//  or failed analytics call must NEVER stall or break the actual
//  learning experience -- that's more important than not losing
//  the odd event.
// ============================================================

import GAS_URL from '../../config/gas.config.js';
import COURSE_CONFIG from '../../config/course.config.js';

const ANON_ID_KEY = 'foothold_anon_id';

// One random ID per browser, persisted forever (or until the
// person clears site data). This is what lets us count unique
// guests, not just registered students.
function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown'; // e.g. localStorage blocked in private browsing
  }
}

// eventType: 'session_start' | 'lesson_open' | 'lesson_complete' | 'signup'
export function logEvent(eventType, { unitId = '', userId = '' } = {}) {
  try {
    const url = `${GAS_URL}?action=logEvent`
      + `&anonId=${encodeURIComponent(getAnonId())}`
      + `&userId=${encodeURIComponent(userId)}`
      + `&eventType=${encodeURIComponent(eventType)}`
      + `&courseId=${encodeURIComponent(COURSE_CONFIG.courseId)}`
      + `&unitId=${encodeURIComponent(unitId)}`;
    // No await, no .then() the caller waits on -- fire and forget.
    fetch(url).catch(() => {});
  } catch {
    // Never let analytics break the app.
  }
}
