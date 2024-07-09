const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();


app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true
}));


app.use(flash());


app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

