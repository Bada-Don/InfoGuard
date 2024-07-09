const express = require('express');
const app = express();
const path = require('path');
const mysql = require("mysql2");
const { faker } = require('@faker-js/faker');
const { error } = require('console');
const { ifError } = require('assert');
var methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

//Middleware
app.engine('ejs', require('ejs').__express);
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});
// Connection
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'InfoGuard',
    password: 'HarshitSingla@mysql'
});

app.listen('8080', () => {
    console.log("App is listening at 8080");
})


// Routes

app.get('/', (req, res) => {
    var query = "SELECT COUNT(*) as count FROM users";
    connection.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching user count:', error);
            res.send("Error in Database");
        } else {
            let count = result[0].count;
            console.log('User count:', count);
            res.render('index', { count });
        }
    });
});

app.get('/users', (req, res) => {
    const q = "SELECT * FROM users";
    connection.query(q, (error, result) => {
        if (error) {
            console.log(error);
            req.flash('error', 'Database error');
            res.redirect('/');
        } else {
            res.render('Users', { users: result });
        }
    });
});

app.get('/users/:id/edit', (req, res) => {
    const id = req.params.id;
    const q = 'SELECT * FROM users WHERE id = ?';
    connection.query(q, [id], (error, result) => {
        if (error) {
            console.log(error);
            req.flash('error', 'Database error');
            res.redirect('/users');
        } else {
            res.render('Edit User', { user: result[0] });
            console.log(result[0]);
        }
    });
});

app.patch('/users/:id', (req, res) => {
    const id = req.params.id;
    const { newUsername, newPassword, currPassword } = req.body;
    const q = 'SELECT * FROM users WHERE id = ?';
    connection.query(q, [id], (error, result) => {
        if (error) {
            req.flash('error', 'Database error');
            res.redirect('/users');
        } else {
            const user = result[0];
            if (user.password !== currPassword) {
                req.flash('error', 'Incorrect Password!');
                res.redirect(`/users/${id}/edit`);
            } else {
                const q2 = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
                connection.query(q2, [newUsername, newPassword, id], (error, result) => {
                    if (error) {
                        req.flash('error', 'Database error');
                        res.redirect(`/users/${id}/edit`);
                    } else {
                        req.flash('success', 'Info Updated');
                        res.redirect('/users');
                    }
                });
            }
        }
    });
});

app.get('/new', (req, res) => {
    res.render('new user');
})
app.post('/new', (req, res) => {
    const { username, email, password, reEnterPassword } = req.body;

    if (password !== reEnterPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/new');
    }

    const emailQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(emailQuery, [email], (error, result) => {
        if (error) {
            req.flash('error', 'Database error');
            return res.redirect('/new');
        }

        if (result.length > 0) {
            req.flash('error', 'Email already exists');
            return res.redirect('/new');
        }

        const id = faker.string.uuid();
        const user = [id, username, email, password];
        const addQuery = 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)';
        connection.query(addQuery, user, (e, r) => {
            if (e) {
                req.flash('error', 'Database error');
                return res.redirect('/new');
            } else {
                req.flash('success', 'User registered successfully');
                res.redirect('/users');
            }
        });
    });
});

app.get('/users/:id/delete', (req, res) => {
    const id = req.params.id;
    const q = `SELECT * FROM users WHERE id = '${id}'`;
    connection.query(q, (error, result) => {
        if (error) {
            req.flash('error', 'Database error');
            res.redirect('/users');
        } else {
            res.render('delete confirm', { user: result[0] });
        }
    });
});

app.delete('/users/:id/', (req, res) => {
    const id = req.params.id;
    const formPassword = req.body.password;
    const q = `SELECT * FROM users WHERE id = '${id}'`;

    connection.query(q, (error, result) => {
        if (error) {
            req.flash('error', 'Database error');
            res.redirect('/users');
        } else {
            const user = result[0];
            if (user.password !== formPassword) {
                req.flash('error', 'Incorrect Password!');
                res.redirect(`/users/${id}/delete`);
            } else {
                const q2 = `DELETE FROM users WHERE id = '${id}'`;
                connection.query(q2, (error, result) => {
                    if (error) {
                        req.flash('error', 'Database error');
                        res.redirect('/users');
                    } else {
                        req.flash('success', 'User Deleted');
                        res.redirect('/users');
                    }
                });
            }
        }
    });
});