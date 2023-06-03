// npm packages
const express = require(`express`);
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('cookie-session');
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
const { dbInitialize } = require('./config/db');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());

const sessionOptions = {
  secret: tokenSecret,
  keys: [tokenSecret],
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 3600000,
  },
};
app.use(session(sessionOptions));

app.use(morgan('dev'));
console.log(NODE_ENV === 'production' ? PRO_URL : LOCAL_URL);
const corsOptions = {
  credentials: true,
  origin: 'https://accounting-as.web.app',
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Allow-Origin',
  ],
};
app.use(cors({ origin: '*' }));

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
app.listen(PORT, async () => {
  await dbInitialize();
  console.log(`Server is running on port ${PORT}`);
});
