// XPBar.jsx
export default function XPBar({ currentXP = 320, nextLevelXP = 500, level = 7 }) {
  const percent = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <strong>Niveau {level}</strong>
        <small>{currentXP} / {nextLevelXP} XP</small>
      </div>

      <div
        className="progress xp-progress"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Barre d'expérience"
      >
        <div
          className="progress-bar bg-xp"
          style={{ width: `${percent}%` }}
        >
          {percent}%
        </div>
      </div>
    </div>
  );
}
