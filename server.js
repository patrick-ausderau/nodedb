'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const express = require('express');
const app = express();
app.use(express.static('public'));

app.enable('trust proxy');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const demoSchema = new Schema({
  test: String,
  more: Number
});

const Demo = mongoose.model('Demo', demoSchema);

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

console.log(process.env);
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}:${process.env.DB_PORT}/demo`, { useNewUrlParser: true }).then(() => {
  console.log('Connected successfully.');
  app.listen(process.env.APP_PORT);
}, err => {
  console.log('Connection to db failed: ' + err);
});

const bcrypt = require('bcrypt');
const session = require('express-session');

// data put in passport cookies needs to be serialized
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(session({
  secret: 'some s3cr3t value',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true, // only over https
    maxAge: 2 * 60 * 60 * 1000} // 2 hours
}));

/* to use when user create password (or modify existing password)
const saltRound = 12; //okayish in 2019
bcrypt.hash(password, saltRound, (err, hash) => {
  // Store hash in the database
  console.log(hash);
});
  */

passport.use(new LocalStrategy(
  (username, password, done) => {
    if (username !== process.env.username || !bcrypt.compareSync(password, process.env.password)) {
      done(null, false, {message: 'Incorrect credentials.'});
      return;
    }
    return done(null, {user: username}); // returned object usally contains something to identify the user
  }
));
app.use(passport.initialize());
app.use(passport.session());

app.use ((req, res, next) => {
  if (req.secure) {
    // request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
});

app.post('/login', 
  passport.authenticate('local', { 
    successRedirect: '/all', 
    failureRedirect: '/test', 
    session: false })
);

app.get('/test', (req, res) => {
  res.send('login fail');
});

app.get('/', (req, res) => {
  if(req.user !== undefined)
    return res.send(`Hello ${req.user.username}!`);
  res.send('Hello Secure World!');
  /*Demo.create({ test: 'More data', more: 7 }).then(post => {
    console.log(post.id);
    res.send('Created dummy data? ' + post.id);
  });*/ 
});

app.get('/all', (req, res) => {
  Demo.find().then(all => {
    console.log(all);
    res.send(all);
  });
});
