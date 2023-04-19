// npm packages
const express = require(`express`);
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
// related imports
const routes = require('./routes');

// utils
const { error404, nextHandler } = require('./utils/errors');
const {
  tokenSecret,
  NODE_ENV,
  LOCAL_URL,
  PRO_URL,
} = require('./config/constants');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());
app.use(
  session({
    secret: tokenSecret,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 1,
      secure: NODE_ENV === 'prod',
      httpOnly: false,
      sameSite: 'none',
    },
    resave: false,
  })
);
app.use(morgan('dev'));
console.log(LOCAL_URL);
app.use(
  cors({ credentials: true, origin: NODE_ENV === 'dev' ? LOCAL_URL : PRO_URL })
);

app.use(routes);

// error handler
app.use(nextHandler);

// not found handler
app.use(error404);

process.on('unhandledRejection', (error) => {
  throw error;
});

process.on('uncaughtException', (error) => {
  console.error(
    `${new Date().toUTCString()} uncaughtException:`,
    error.message
  );
  console.error(error);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
