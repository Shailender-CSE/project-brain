import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import './Intro.css';
import TeamReveal from '../components/intro/TeamReveal';

import logoImage from '../assets/tech-blitz-logo.png';

const STAGES = [
  'TECH', 'BLITZ', 'LOGO', 'TEAM_CENTER', 'TEAM_EXTREME_LEFT',
  'TEAM_INNER_LEFT', 'TEAM_INNER_RIGHT', 'TEAM_EXTREME_RIGHT',
  'FULL_TEAM', 'FINAL_HOLD', 'LOGIN',
];

const NEXT_STAGE = {
  TECH: 'BLITZ',
  BLITZ: 'LOGO',
  LOGO: 'TEAM_CENTER',
  TEAM_CENTER: 'TEAM_EXTREME_LEFT',
  TEAM_EXTREME_LEFT: 'TEAM_INNER_LEFT',
  TEAM_INNER_LEFT: 'TEAM_INNER_RIGHT',
  TEAM_INNER_RIGHT: 'TEAM_EXTREME_RIGHT',
  TEAM_EXTREME_RIGHT: 'FULL_TEAM',
  FULL_TEAM: 'FINAL_HOLD',
  FINAL_HOLD: 'LOGIN',
};

const HOLD_MS = {
  TECH: 700,
  BLITZ: 900,
  LOGO: 1700,
  TEAM_CENTER: 700,
  TEAM_EXTREME_LEFT: 600,
  TEAM_INNER_LEFT: 600,
  TEAM_INNER_RIGHT: 600,
  TEAM_EXTREME_RIGHT: 700,
  FULL_TEAM: 2600,
  FINAL_HOLD: 1200,
};

const SOUND_FILES = {
  TECH: '/sounds/tech.mp3',
  BLITZ: '/sounds/blitz.mp3',
  LOGO: '/sounds/logo.mp3',
  TEAM_CENTER: '/sounds/member.mp3',
  TEAM_EXTREME_LEFT: '/sounds/member.mp3',
  TEAM_INNER_LEFT: '/sounds/member.mp3',
  TEAM_INNER_RIGHT: '/sounds/member.mp3',
  TEAM_EXTREME_RIGHT: '/sounds/member.mp3',
  FULL_TEAM: '/sounds/team-merge.mp3',
};

export default function Intro() {
  const navigate = useNavigate();
  const { user, introSeen, markIntroSeen } = useAuth();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState('TECH');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    if (user) { navigate('/dashboard', { replace: true }); return; }
    if (introSeen()) { navigate('/login', { replace: true }); return; }
    if (reduce) { markIntroSeen(); navigate('/login', { replace: true }); return; }
  }, [user, introSeen, markIntroSeen, reduce, navigate]);

  useEffect(() => {
    if (!soundEnabled) return;
    const src = SOUND_FILES[stage];
    if (!src) return;
    try {
      const a = new Audio(src);
      a.volume = 0.6;
      a.play().catch(() => {});
    } catch (e) {}
  }, [stage, soundEnabled]);

  useEffect(() => {
    if (stage === 'LOGIN') {
      markIntroSeen();
      navigate('/login', { replace: true });
      return;
    }
    const delay = HOLD_MS[stage];
    if (!delay) return;
    const id = setTimeout(() => {
      const next = NEXT_STAGE[stage];
      if (next) setStage(next);
    }, delay);
    return () => clearTimeout(id);
  }, [stage, markIntroSeen, navigate]);

  const skip = () => { markIntroSeen(); navigate('/login', { replace: true }); };

  const idx = STAGES.indexOf(stage);
  const showTech = stage === 'TECH' || stage === 'BLITZ';
  const showBlitz = stage === 'BLITZ';
  const showLogo = stage === 'LOGO';
  const showTeam = idx >= STAGES.indexOf('TEAM_CENTER') && stage !== 'LOGIN';

  return (
    <div className="intro-root">
      <div className="intro-bg" />
      <div className="intro-particles" />

      <div className="intro-center">
        <AnimatePresence>
          {showTech && (
            <motion.div
              key="tech"
              className="intro-tech"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              TECH
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBlitz && (
            <motion.div
              key="blitz"
              className="intro-blitz"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            >
              BLITZ
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showLogo && (
          <motion.div
            key="logo"
            className="logo-reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={logoImage}
              alt="TECH BLITZ"
              className="logo-img logo-glow"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTeam && (
          <motion.div
            key="team"
            className="team-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TeamReveal stage={stage} />
          </motion.div>
        )}
      </AnimatePresence>

      <button className="sound-toggle" onClick={() => setSoundEnabled((v) => !v)}>
        {soundEnabled ? 'Sound: On' : 'Enable Sound'}
      </button>
      <button className="skip-intro" onClick={skip}>Skip Intro</button>
    </div>
  );
}
