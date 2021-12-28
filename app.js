const express = require('express');
require('colors');

// import .env variables
const dotenv = require('dotenv');
dotenv.config({ path: './config/vars.env' });

const db = require('./config/db');
const cors = require('cors');
const app = express();
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
// const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const errorHandler = require('./middlewares/errorHandler');

app.use(cors());
app.use(hpp());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database connection
db.then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening to port ${process.env.PORT}...`.cyan.bold);
  });
  console.log('Connected to database'.yellow.bold);
}).catch((err) => {
  console.log(err);
  console.log(`${err.name}: ${err.message}`.red.bold);
  console.log('Error connecting to database !'.red.bold);
});

// security
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());

// limits 100 requests per 10 mins (currently not working)
// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 100,
//   message: 'Too many request from this IP',
// });
// app.use(limiter);

const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginRoutes');

app.use('/users', userRoutes);
app.use('/login', loginRoutes);

// error handler
app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log(`${err.name}: ${err.message}`.bold.red);
  console.log('UNHANDLED REJECTION! SERVER SHUT DOWN!'.bold.red);
  process.exit(1);
});
