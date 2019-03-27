'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const express = require('express');
const app = express();

app.enable('trust proxy');

const demoSchema = new Schema({
  test: String,
  more: Number
});

const Demo = mongoose.model('Demo', demoSchema);

console.log(process.env);
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}:${process.env.DB_PORT}/demo`, { useNewUrlParser: true }).then(() => {
  console.log('Connected successfully.');
  app.listen(process.env.APP_PORT);
}, err => {
  console.log('Connection to db failed: ' + err);
});

app.use ((req, res, next) => {
  if (req.secure) {
    // request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
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
