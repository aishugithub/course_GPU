import COURSE_CONFIG from '../../config/course.config.js';
import { DARK as D, FONT, MONO } from './brand.js';

function FootholdMark({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }} aria-hidden="true">
      <rect x="8" y="60" width="26" height="26" rx="7" fill={D.inkSoft} />
      <rect x="37" y="37" width="26" height="26" rx="7" fill={D.inkSoft} />
      <rect x="66" y="14" width="26" height="26" rx="7" fill={D.amber} />
    </svg>
  );
}

function Kicker({ children }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: D.bronze, marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16,
      padding: '26px 30px', ...style,
    }}>
      {children}
    </div>
  );
}

export default function Landing({ onExploreGuest, onGoToLogin }) {
  const totalUnits = COURSE_CONFIG.modules.reduce((acc, m) => acc + m.units.length, 0);

  const primaryBtn = {
    background: D.amber, color: '#111A2E', border: 'none', borderRadius: 12,
    padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: FONT,
  };
  const outlineBtn = {
    background: 'transparent', color: D.ink, border: `1.5px solid ${D.border}`,
    borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 600,
    cursor: 'pointer', fontFamily: FONT,
  };

  return (
    <div style={{ minHeight: '100vh', background: D.bgDeep, fontFamily: FONT, color: D.ink }}>

      <div style={{ padding: '64px 24px 48px', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <FootholdMark size={96} />
        </div>

        <Kicker>Free · Self-paced · No account needed</Kicker>

        <h1 style={{
          fontSize: 'clamp(40px, 9vw, 56px)', fontWeight: 700, margin: 0,
          letterSpacing: '-0.02em', color: D.ink,
        }}>
          Foothold
        </h1>
        <p style={{ color: D.amber, fontFamily: MONO, fontSize: 'clamp(14px, 3.5vw, 17px)', fontWeight: 700, margin: '10px 0 0' }}>
          Get your footing. Keep climbing.
        </p>

        <p style={{ color: D.inkSoft, fontSize: 17, lineHeight: 1.65, margin: '22px auto 0', maxWidth: 580 }}>
          Have you got your foothold on the machine behind AI? A free, self-paced course on
          GPU computing for AI — from a single neuron to thousands of GPU cores working together. No prior
          AI knowledge, no cost, and no account required to start.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap' }}>
          <button onClick={onExploreGuest} style={primaryBtn}>
            Explore the Dashboard →
          </button>
          <button onClick={onGoToLogin} style={outlineBtn}>
            Sign In / Register
          </button>
        </div>
        <p style={{ color: D.inkMuted, fontSize: 13, marginTop: 14 }}>
          Browsing is always free — signing in just lets you keep your progress across devices.
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 52px' }}>
        <div style={{
          background: D.navyPanel, color: D.ink, borderRadius: 14,
          border: `1px solid ${D.border}`,
          padding: '20px 24px', fontFamily: MONO, fontSize: 14, lineHeight: 1.8,
          overflowX: 'auto', textAlign: 'left',
        }}>
          <div><span style={{ color: D.amber }}>LOAD</span>&nbsp;&nbsp;R1, 5</div>
          <div><span style={{ color: D.amber }}>ADD</span>&nbsp;&nbsp;&nbsp;R1, R1, 3</div>
          <div style={{ color: D.inkSoft }}>R1 = 8&nbsp;&nbsp;<span style={{ color: D.inkMuted }}># you just ran an instruction by hand.</span></div>
          <div style={{ color: D.inkMuted }}># {totalUnits}+ interactive lessons between you and the summit.</div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 28px' }}>
        <Card>
          <Kicker>Who this is for</Kicker>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: D.ink }}>
            Curious what happens beneath the code? Perfect.
          </h2>
          <p style={{ color: D.inkSoft, fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
            Foothold is for anyone curious about what happens beneath the code — how bits, registers,
            memory and buses come together into a working machine. Students, self-learners, curious
            minds, wherever you are. {totalUnits}+ interactive lessons, each built around a single
            idea you can click, drag, or step through rather than just read.
          </p>
        </Card>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 28px' }}>
        <Card style={{ borderLeft: `4px solid ${D.amber}` }}>
          <Kicker>How you'll learn</Kicker>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: D.ink }}>
            One reachable step at a time
          </h2>
          <p style={{ color: D.inkSoft, fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
            Foothold is built on a well-studied idea from learning science: Lev Vygotsky's{' '}
            <strong style={{ color: D.ink }}>Zone of Proximal Development</strong>. We learn
            best not from what we already know, and not from what's far beyond us, but from
            the narrow band just past our current ability — reachable with the right support.
            That support is called <strong style={{ color: D.ink }}>scaffolding</strong>:
            temporary structure that holds you up while a skill is new, and is gradually
            removed as you build your own footing. Every lesson here follows that idea —
            a new concept arrives only once you have exactly what you need to understand it,
            with just enough support to carry you the rest of the way on your own.
          </p>
          <p style={{
            color: D.inkSoft, fontSize: 14.5, lineHeight: 1.7, margin: '18px 0 0',
            paddingTop: 16, borderTop: `1px solid ${D.border}`,
          }}>
            <strong style={{ color: D.ink }}>The research behind this course:</strong> I'm{' '}
            <strong style={{ color: D.ink }}>Aishwarya</strong>, an Assistant Professor of Engineering, and
            Foothold is my action research in education — a study of whether active learning through
            interactive content helps beginners learn better than reading or watching alone. That's
            why every single lesson here is something you <em>do</em>, not something you sit through.
            Your anonymous progress through the lessons quietly contributes to this research and
            helps make the course better for the next learner.
          </p>
        </Card>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 64px' }}>
        <Card>
          <Kicker>Learn your way</Kicker>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: D.ink }}>
            Every module is open. No locks, no gates.
          </h2>
          <p style={{ color: D.inkSoft, fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
            Once you're in the Dashboard, click whichever module interests you, in any order.
            That said, since each unit builds on the ones before it, we{' '}
            <strong style={{ color: D.ink }}>recommend going step by step</strong> the first
            time through — it makes for the smoothest climb.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button onClick={onExploreGuest} style={{ ...primaryBtn, padding: '12px 24px', fontSize: 15 }}>
              Take me to the Dashboard →
            </button>
          </div>
        </Card>
      </div>

      <div style={{ textAlign: 'center', color: D.inkMuted, fontSize: 12.5, paddingBottom: 44, fontFamily: MONO }}>
        Your progress is saved on this device automatically. Sign in anytime to keep it across devices.
      </div>
    </div>
  );
}
