require('dotenv').config();

const common = {
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  dialectOptions: {}
};

// Active SSL si besoin (facultatif)
if (process.env.DB_SSL === 'true') {
  common.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    ...common
  },
  production: {
    // 1) Si tu préfères l’URL unique :
    use_env_variable: 'DATABASE_URL',
    ...common
    // 2) OU, si tu préfères les variables granulaires, commente la ligne au-dessus
    // et dé-commente ce bloc :
    // username: process.env.DB_USER,
    // password: process.env.DB_PASS,
    // database: process.env.DB_NAME,
    // host: process.env.DB_HOST,
    // ...common
  }
};
