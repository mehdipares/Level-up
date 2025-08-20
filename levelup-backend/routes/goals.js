const express = require('express');
const router = express.Router();
const { Goal, User, Category } = require('../models');
const { calculateNextLevelXp } = require('../utils/xp');

// GET /goals – liste tous les objectifs avec user + catégorie
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });
    res.json(goals);
  } catch (error) {
    console.error('Erreur GET /goals:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// PATCH /goals/:id – marquer un objectif comme complété + monter de niveau
router.patch('/:id', async (req, res) => {
  const goalId = req.params.id;

  try {
    const goal = await Goal.findByPk(goalId);
    if (!goal) return res.status(404).json({ error: 'Objectif non trouvé' });
    if (goal.completed) return res.status(400).json({ error: 'Objectif déjà complété' });

    // 1. Marquer l’objectif comme complété
    goal.completed = true;
    await goal.save();

    // 2. Récupérer l’utilisateur
    const user = await User.findByPk(goal.user_id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // 3. Ajouter l’XP
    user.xp += goal.xp_reward;

    // 4. Monter de niveau si besoin
    let nextLevelXp = calculateNextLevelXp(user.level);
    while (user.xp >= nextLevelXp) {
      user.level += 1;
      nextLevelXp = calculateNextLevelXp(user.level);
    }

    await user.save();

    res.json({
      message: '🎯 Objectif complété !',
      gained_xp: goal.xp_reward,
      new_level: user.level,
      current_xp: user.xp
    });

  } catch (error) {
    console.error('Erreur PATCH /goals/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// POST /goals – créer un nouvel objectif
router.post('/', async (req, res) => {
  const {
    user_id,
    category_id,
    title,
    description,
    frequency,
    xp_reward,
    completed,
    due_date
  } = req.body;

  try {
    const goal = await Goal.create({
      user_id,
      category_id,
      title,
      description,
      frequency,
      xp_reward,
      completed: completed || false,
      due_date
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Erreur POST /goals :', error);
    res.status(500).json({ error: 'Erreur lors de la création de l’objectif' });
  }
});


module.exports = router;
