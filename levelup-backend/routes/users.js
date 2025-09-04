const express = require('express');
const router = express.Router();
const { User, UserPriority, Category } = require('../models');
const { progressFromTotalXp } = require('../utils/xp');

// GET /users/:id  → profil + xp_progress + onboarding_done
router.get('/:id', async (req, res) => {
  try {
    const u = await User.findByPk(req.params.id, {
      attributes: ['id', 'email', 'username', 'xp', 'level', 'onboarding_done', 'createdAt', 'updatedAt'] // ✅ ajout
    });
    if (!u) return res.status(404).json({ error: 'User not found' });

    const xp_progress = progressFromTotalXp(u.xp || 0);

    res.json({
      id: u.id,
      email: u.email,
      username: u.username,
      xp: u.xp || 0,
      level: u.level || 1,
      onboarding_done: (u.onboarding_done === true || u.onboarding_done === 1 || u.onboarding_done === '1'), // ✅ bool robuste
      xp_progress, // { prevTotal,nextTotal,current,span,percent,level(calculé) }
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    });
  } catch (e) {
    console.error('GET /users/:id', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /users/:id/priorities → préférences (catégorie + score)
router.get('/:id/priorities', async (req, res) => {
  try {
    const prefs = await UserPriority.findAll({
      where: { user_id: req.params.id },
      include: [{ model: Category, as: 'Category' }],
      order: [['score', 'DESC']]
    });
    res.json(prefs);
  } catch (e) {
    console.error('GET /users/:id/priorities', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
