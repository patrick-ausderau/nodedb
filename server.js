'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');
const saltRound = 12; //okayish in 2019

/*bcrypt.hash(myPwd, saltRound, (err, hash) => {
  // Store hash in the database
});
  */

const express = require('express');
const app = express();

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

passport.use(new LocalStrategy(
  (username, password, done) => {
    if (username !== process.env.username || !bcrypt.compareSync(password, process.env.password)) {
      console.log("Never log that!!!!! " + username + " " + password);
      done(null, false, {message: 'Incorrect credentials.'});
      return;
    }
    return done(null, {user: username}); // returned object usally contains something to identify the user
  }
));
app.use(passport.initialize());

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
  Demo.create({ test: 'More data', more: 7 }).then(post => {
    console.log(post.id);
    res.send('Created dummy data? ' + post.id);
  }); 
});

app.get('/all', (req, res) => {
  Demo.find().then(all => {
    console.log(all);
    res.send(all);
  });
});
