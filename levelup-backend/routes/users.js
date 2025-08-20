const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { calculateNextLevelXp } = require('../utils/xp'); // ✅ import de la fonction centrale

// GET /users – liste tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Erreur GET /users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /users – créer un nouvel utilisateur
router.post('/', async (req, res) => {
  const { username, email, password_hash, level, xp } = req.body;
  try {
    const newUser = await User.create({
      username,
      email,
      password_hash,
      level: level || 1,
      xp: xp || 0
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erreur POST /users:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l’utilisateur' });
  }
});


const { Goal, Category } = require('../models');

// GET /users/:id/goals – tous les objectifs d’un utilisateur
router.get('/:id/goals', async (req, res) => {
  const userId = req.params.id;
  try {
    const goals = await Goal.findAll({
      where: { user_id: userId },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });
    res.json(goals);
  } catch (error) {
    console.error('Erreur GET /users/:id/goals:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /users/:id/xp – Affiche XP et progression du user
router.get('/:id/xp', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const xpNeeded = calculateNextLevelXp(user.level);
    const xpRemaining = Math.max(0, xpNeeded - user.xp);
    const progress = Math.min(100, (user.xp / xpNeeded) * 100);

    res.json({
      level: user.level,
      current_xp: user.xp,
      xp_for_next_level: xpNeeded,
      xp_remaining: xpRemaining,
      progress_percent: Math.round(progress * 100) / 100
    });

  } catch (error) {
    console.error('Erreur GET /users/:id/xp:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// GET /users/leaderboard – Classement des utilisateurs par XP
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'xp', 'level'],
      order: [
        ['xp', 'DESC'],
        ['level', 'DESC']
      ],
      limit: 10 // 🔢 Affiche les 10 premiers, tu peux augmenter
    });

    res.json(users);

  } catch (error) {
    console.error('Erreur GET /users/leaderboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;
