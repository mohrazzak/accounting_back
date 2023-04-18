// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_DIALACT,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  DB_URL,
  WEBSITE_PASSWORD,
} = process.env;

module.exports = Object.freeze({
  DB_USERNAME,
  DB_PASSWORD,
  DB_DIALACT,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  DB_URL,
  WEBSITE_PASSWORD,
});
