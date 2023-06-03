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
  // credentials: true,
  origin: 'https://accounting-as.web.app',
};
// Add headers before the routes are defined
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://accounting-as.web.app');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );
res.header('Access-Control-Allow-Origin', 'https://accounting-as.web.app');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

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
