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
const sessionConfig = {
  secret: tokenSecret,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 1,
    // secure: NODE_ENV === 'production',
    // httpOnly: false,
    // sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  },
  resave: false,
};

// if (NODE_ENV === 'production') {
//   app.set('trust proxy', 1); // trust first proxy
//   sessionConfig.cookie.secure = true; // serve secure cookies
// }

app.use(session(sessionConfig));

app.use(morgan('dev'));
const corsOptions = {
  credentials: true,
  // origin: NODE_ENV === 'production' ? PRO_URL : LOCAL_URL,
};
app.use(cors(corsOptions));

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
