// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Import explicite (comme chez toi)
db.User               = require('./user')(sequelize, Sequelize.DataTypes);
db.Category           = require('./category')(sequelize, Sequelize.DataTypes);
db.GoalTemplate       = require('./goaltemplate')(sequelize, Sequelize.DataTypes);
db.UserGoal           = require('./usergoal')(sequelize, Sequelize.DataTypes);
db.UserGoalCompletion = require('./usergoalcompletion')(sequelize, Sequelize.DataTypes);
db.UserPriority       = require('./userpriority')(sequelize, Sequelize.DataTypes);
db.Quote              = require('./quote')(sequelize, Sequelize.DataTypes);

// ✅ nouveaux modèles onboarding
db.OnboardingQuestion         = require('./OnboardingQuestion')(sequelize, Sequelize.DataTypes);
db.OnboardingQuestionWeight   = require('./OnboardingQuestionWeight')(sequelize, Sequelize.DataTypes);
db.UserOnboardingSubmission   = require('./UserOnboardingSubmission')(sequelize, Sequelize.DataTypes);
db.UserQuestionnaireAnswer    = require('./UserQuestionnaireAnswer')(sequelize, Sequelize.DataTypes);

// Appel des associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
