import { useState, useEffect, Suspense } from 'react';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import { getProgress, saveProgress } from './api.js';
import { getGuestProgress, saveGuestProgress } from './guestProgress.js';
import { logEvent } from './analytics.js';
import COURSE_CONFIG from '../../config/course.config.js';
import { DARK, FONT } from './brand.js';

// Loading screens now use the DARK shell palette (see brand.js): landing,
// dashboard and login are all dark-and-on-brand, and the lessons are dark too,
// so a dark loading screen sits seamlessly between any two views — no flash.
function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div style={{ minHeight: '100vh', background: DARK.bgDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, gap: 16 }}>
      {/* The brand mark doubles as the loading glyph — steps to climb. On dark,
          the two lower steps go light and the summit stays amber. */}
      <svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true">
        <rect x="8" y="60" width="26" height="26" rx="7" fill={DARK.inkSoft} />
        <rect x="37" y="37" width="26" height="26" rx="7" fill={DARK.inkSoft} />
        <rect x="66" y="14" width="26" height="26" rx="7" fill={DARK.amber} />
      </svg>
      <div style={{ color: DARK.inkSoft, fontSize: 15 }}>{message}</div>
    </div>
  );
}

const LESSONS = import.meta.glob('../lessons/*.jsx');

// view walks: 'landing' -> 'dashboard' (guest or signed-in) -> 'lesson'.
// 'login' is reachable from either 'landing' or 'dashboard' (guest wanting
// to save progress), and always returns to 'dashboard' one way or another.
export default function App() {
  const [view, setView]                       = useState('landing');
  const [student, setStudent]                 = useState(null); // null = guest
  const [completedUnits, setCompletedUnits]   = useState([]);
  const [activeUnit, setActiveUnit]           = useState(null);
  // Remembers the LAST unit opened even after we return to the dashboard
  // (activeUnit is cleared on "back", this is not). The dashboard uses it to
  // re-expand the module the learner just came from, instead of snapping back
  // to Module 0. Persisted so a page reload also restores the right module.
  const [lastUnitId, setLastUnitId]           = useState(() => {
    try { return localStorage.getItem('foothold_lastUnit_' + COURSE_CONFIG.courseId) || null; }
    catch { return null; }
  });
  const [LessonComponent, setLessonComponent] = useState(null);
  const [loadingLesson, setLoadingLesson]     = useState(false);
  const [savingProgress, setSavingProgress]   = useState(false);

  // One 'session_start' event per app load -- fires the moment
  // anyone lands here, guest or not, before they've made any choice.
  useEffect(() => { logEvent('session_start'); }, []);

  // "Explore the Dashboard" from Landing, or "continue without an account"
  // from Login -- both land here. Guest progress comes from this browser's
  // localStorage, not the Sheets backend.
  function handleExploreGuest() {
    setStudent(null);
    setCompletedUnits(getGuestProgress(COURSE_CONFIG.courseId));
    setView('dashboard');
  }

  function handleGoToLogin() { setView('login'); }

  // Signing off just clears who's logged in and sends them back to the
  // Landing screen -- it doesn't touch anything already saved in Sheets,
  // and if they were exploring as a guest before, that local progress is
  // untouched too (it lives under a different key in localStorage).
  function handleSignOff() {
    setStudent(null);
    setCompletedUnits([]);
    setView('landing');
  }

  // Called by Login.jsx after either a successful sign-in OR a successful
  // registration -- both return the same { rollNo, name, batch, email } shape.
  async function handleLoginSuccess(studentData) {
    setStudent(studentData);
    const completed = await getProgress(studentData.rollNo, COURSE_CONFIG.courseId);
    setCompletedUnits(completed);
    setView('dashboard');
  }

  async function handleSelectUnit(unitId) {
    setLoadingLesson(true);
    setActiveUnit(unitId);
    // Record which unit (hence which module) we're entering, so the dashboard
    // can re-open that module when the learner comes back.
    setLastUnitId(unitId);
    try { localStorage.setItem('foothold_lastUnit_' + COURSE_CONFIG.courseId, unitId); } catch { /* ignore */ }
    try {
      const path = `../lessons/${unitId}.jsx`;
      const loader = LESSONS[path];
      if (!loader) throw new Error('No lesson file found: ' + unitId);
      const mod = await loader();
      setLessonComponent(() => mod.default);
      logEvent('lesson_open', { unitId, userId: student?.rollNo || '' });
    } catch (err) {
      console.error('Could not load lesson:', unitId, err);
      setLessonComponent(null);
      setActiveUnit(null);
    }
    setLoadingLesson(false);
  }

  async function handleUnitComplete() {
    if (!activeUnit) return;
    if (student) {
      // Signed-in: persist to Sheets. This can be slow (free Apps Script
      // backend), so show a brief "saving" state rather than freezing
      // with no feedback.
      setSavingProgress(true);
      await saveProgress(student.rollNo, COURSE_CONFIG.courseId, activeUnit);
      setSavingProgress(false);
    } else {
      // Guest: instant, local, no network round-trip.
      saveGuestProgress(COURSE_CONFIG.courseId, activeUnit);
    }
    logEvent('lesson_complete', { unitId: activeUnit, userId: student?.rollNo || '' });
    setCompletedUnits(prev => [...new Set([...prev, activeUnit])]);
    setActiveUnit(null); setLessonComponent(null);
  }

  // Crucible (challenge unit) stage completions. Stages persist as
  // pseudo-unitIds like "Unit4_C@spark" in the SAME stores as lessons
  // (Progress sheet / guest localStorage) -- no backend change needed.
  // The Dashboard filters these out of counts via the "@" marker.
  // Deliberately not awaited: stage progress is also held in state, and
  // a slow save must never stall the game feel of the Crucible.
  function handleStageComplete(stageId) {
    if (student) {
      saveProgress(student.rollNo, COURSE_CONFIG.courseId, stageId);
    } else {
      saveGuestProgress(COURSE_CONFIG.courseId, stageId);
    }
    logEvent('challenge_stage_complete', { unitId: stageId, userId: student?.rollNo || '' });
    setCompletedUnits(prev => [...new Set([...prev, stageId])]);
  }

  function handleBackToDashboard() { setActiveUnit(null); setLessonComponent(null); }

  if (view === 'landing') {
    return <Landing onExploreGuest={handleExploreGuest} onGoToLogin={handleGoToLogin} />;
  }

  if (view === 'login') {
    return <Login onLogin={handleLoginSuccess} onBack={handleExploreGuest} />;
  }

  if (loadingLesson) return <LoadingScreen message="Loading lesson…" />;
  if (savingProgress) return <LoadingScreen message="Saving your progress… this can take a few seconds." />;

  if (activeUnit && LessonComponent) {
    // A small icon-only button instead of a text pill: on a phone screen,
    // reserving a fixed margin to dodge the lesson's own header would waste
    // a big chunk of a very small viewport. A compact circular button covers
    // only a tiny corner, and the arrow is a self-explanatory "back" icon on
    // its own -- the title/aria-label add a hover tooltip for desktop users
    // without needing any permanent on-screen text or layout shift.
    return (
      <div className="lesson-viewport">
        {/* Desktop-only upscale: lessons hardcode maxWidth:780, which leaves
            ~25% of a wide monitor empty. zoom scales fonts, widgets and
            spacing together (780px column → ~975px effective at 1.25).
            Phones/tablets never match the media query, so mobile rendering
            is untouched byte-for-byte. Tune 1.25 here if it feels off. */}
        <style>{`
          @media (min-width: 1200px) {
            .lesson-viewport { zoom: 1.25; }
          }
        `}</style>
        <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 1000 }}>
          <button
            onClick={handleBackToDashboard}
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(28,35,51,0.9)', border: '1px solid #30363D',
              color: '#C9D1D9', fontSize: 18, lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>
        </div>
        <Suspense fallback={<LoadingScreen message="Preparing lesson…" />}>
          {/* Regular lessons use only the first two props; Crucible units
              also read challengeProgress + onStageComplete for gating. */}
          <LessonComponent
            student={student}
            onUnitComplete={handleUnitComplete}
            challengeProgress={completedUnits}
            onStageComplete={handleStageComplete}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <Dashboard
      student={student}
      completedUnits={completedUnits}
      onSelectUnit={handleSelectUnit}
      onRequestLogin={handleGoToLogin}
      onSignOff={handleSignOff}
      returnUnitId={lastUnitId}
    />
  );
}
