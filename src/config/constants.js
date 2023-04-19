// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

const { tokenSecret, WEBSITE_PASSWORD, DB_URL, LOCAL_URL, PRO_URL, NODE_ENV } =
  process.env;
module.exports = Object.freeze({
  WEBSITE_PASSWORD,
  tokenSecret,
  DB_URL,
  LOCAL_URL,
  NODE_ENV,
  PRO_URL,
});
