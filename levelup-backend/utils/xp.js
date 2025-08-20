// Fonction partagée : XP nécessaire pour passer au niveau suivant
function calculateNextLevelXp(level) {
  return Math.floor(50 * level + Math.pow(level, 1.8));
}

module.exports = { calculateNextLevelXp };
