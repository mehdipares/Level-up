require('dotenv').config();
const usersRouter = require('./routes/users');
const goalsRouter = require('./routes/goals');
const express = require('express');
const { sequelize } = require('./models');
const categoriesRouter = require('./routes/categories');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const app = express();
const PORT = 3000;


app.use(cors({
  origin: 'http://localhost:3001', // front React
  credentials: true
}));


app.use(express.json());
//établissement routes 
app.use('/users', usersRouter);
app.use('/goals', goalsRouter);
app.use('/categories', categoriesRouter);
app.use('/auth', authRoutes);

//message console 
app.get('/', (req, res) => {
  res.send('LevelUp backend is running!');
});

//message port/succes
app.listen(PORT, async () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données :', error);
  }
});
