import { motion, AnimatePresence } from 'framer-motion';
import './TeamReveal.css';

import teamPhoto from '../../assets/tech-blitz-team.png';
import centerBoy from '../../assets/intro/center-boy.png';
import extremeLeftGirl from '../../assets/intro/extreme-left-girl.png';
import innerLeftGirl from '../../assets/intro/inner-left-girl.png';
import innerRightBoy from '../../assets/intro/inner-right-boy.png';
import extremeRightGirl from '../../assets/intro/extreme-right-girl.png';

const TEAM_STAGES = [
  'TEAM_CENTER', 'TEAM_EXTREME_LEFT', 'TEAM_INNER_LEFT',
  'TEAM_INNER_RIGHT', 'TEAM_EXTREME_RIGHT', 'FULL_TEAM', 'FINAL_HOLD',
];

export default function TeamReveal({ stage }) {
  const showCenter = TEAM_STAGES.indexOf(stage) >= TEAM_STAGES.indexOf('TEAM_CENTER');
  const showExtremeLeft = TEAM_STAGES.indexOf(stage) >= TEAM_STAGES.indexOf('TEAM_EXTREME_LEFT');
  const showInnerLeft = TEAM_STAGES.indexOf(stage) >= TEAM_STAGES.indexOf('TEAM_INNER_LEFT');
  const showInnerRight = TEAM_STAGES.indexOf(stage) >= TEAM_STAGES.indexOf('TEAM_INNER_RIGHT');
  const showExtremeRight = TEAM_STAGES.indexOf(stage) >= TEAM_STAGES.indexOf('TEAM_EXTREME_RIGHT');
  const showFullPhoto = stage === 'FULL_TEAM' || stage === 'FINAL_HOLD';

  return (
    <div className="team-reveal-root">
      <motion.div
        className="team-cutouts"
        animate={{ opacity: showFullPhoto ? 0 : 1 }}
        transition={{ duration: 0.9 }}
      >
        {showCenter && (
          <motion.img
            src={centerBoy}
            alt="center boy"
            className="cutout cutout-center"
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {showExtremeLeft && (
          <motion.img
            src={extremeLeftGirl}
            alt="extreme left girl"
            className="cutout cutout-extreme-left"
            initial={{ opacity: 0, x: -80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {showInnerLeft && (
          <motion.img
            src={innerLeftGirl}
            alt="inner left girl"
            className="cutout cutout-inner-left"
            initial={{ opacity: 0, x: -60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {showInnerRight && (
          <motion.img
            src={innerRightBoy}
            alt="inner right boy"
            className="cutout cutout-inner-right"
            initial={{ opacity: 0, x: 60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {showExtremeRight && (
          <motion.img
            src={extremeRightGirl}
            alt="extreme right girl"
            className="cutout cutout-extreme-right"
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showFullPhoto && (
          <motion.img
            key="full-team"
            src={teamPhoto}
            alt="TECH BLITZ team"
            className="team-full-photo"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
