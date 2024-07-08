const express = require('express');
const app = express();
const path = require('path');
const mysql = require("mysql2");
const { faker } = require('@faker-js/faker');
const { error } = require('console');
const { ifError } = require('assert');
var methodOverride = require('method-override');

app.engine('ejs', require('ejs').__express);
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'InfoGuard',
    password: 'HarshitSingla@mysql'
});

app.listen('8080', () => {
    console.log("App is listening at 8080");
})

app.get('/', (req, res) => {
    var query = "SELECT COUNT(*) as count FROM users";
    connection.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching user count:', error);
            res.send("Error in Database");
        } else {
            let count = result[0].count;
            console.log('User count:', count);
            res.render('Home Page', { count });
        }
    });
});

app.get('/users', (req, res) => {
    let q = "SELECT * FROM users";
    try {
        connection.query(q, (error, result) => {
            if (error) throw (error);
            let users = result;
            res.render('Users', { users });
        })

    } catch (error) {
        console.log(error);
    }
})

app.get('/users/:id/edit', (req, res) => {
    let id = req.params.id;
    let q = 'SELECT * FROM users WHERE id = ?';
    try {
        connection.query(q, [id], (error, result) => {
            if (error) throw (error);
            const user = result[0];
            console.log(user);
            res.render('Edit User', { user });
        })
    } catch (error) {
        console.log(error);
        res.send("Error in Database");
    }
})

app.patch('/users/:id', (req, res) => {
    let id = req.params.id;
    let newUsername = req.body.newUsername;
    let newPassword = req.body.newPassword;
    const q = 'SELECT * FROM users WHERE id = ?';
    try {
        connection.query(q, [id], (error, result) => {
            if (error) throw error;
            const currPassword = result[0].password;
            const chkpassword = req.body.currPassword;
            if (currPassword !== chkpassword) {
                return res.send("Incorrect Password!!");
            }
            const q2 = `UPDATE users SET username = ?, password = ? WHERE id = ?`;
            const values = [newUsername, newPassword, id]

            connection.query(q2, values, (error, result) => {
                if (error) throw error;
                console.log(result);
                res.redirect('/users');
            });

        })
    } catch (error) {
        console.log(error);
        res.send("Error in Database");
    }
});

app.get('/new', (req, res) => {
    res.render('new user');
})
app.post('/new', (req, res) => {
    const { username, email, password, reEnterPassword } = req.body;

    if (password !== reEnterPassword) {
        res.send('Passwords do not match');
    }

    let emailQuery = `SELECT * FROM users WHERE email = ?`;
    try {
        connection.query(emailQuery, [email], (error, result) => {
            if (error) throw error;

            if (result.length > 0) {
                return res.render('new user', { success: null, error: "Email already registered" });
            }

                const id = faker.string.uuid();
                const user = [id, username, email, password];
                let addQuery = `INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)`;
                try {
                    connection.query(addQuery, user, (e, r) => {
                        if (e) throw e;
                        console.log(r);
                        res.redirect('/users');
                    })
                } catch (error) {
                    console.log(error);
                    res.send("Some error in DATABASE!");
                }
        })
    } catch (error) {
        console.log(error);
        res.send("Some error in DATABASE!");
    }



    // let query = 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)';
    // connection.query(query, user, (error, result) => {
    //     if (error) {
    //         console.log(error);
    //         return res.send("Error in database");
    //     }
    //     console.log(result);
    //     return res.send("New user registered successfully");
    // });

})

app.get('/users/:id/delete', (req, res) => {
    var id = req.params.id;
    let q = `SELECT * FROM users WHERE id = '${id}'`;
    connection.query(q, (error, result) => {
        let user = result[0];
        if (error) throw error;
        res.render('delete confirm', { user });
    });
});

app.delete('/users/:id/', (req, res) => {
    let { id } = req.params;
    let formPassword = req.body;
    let q = `SELECT * FROM users WHERE id = '${id}'`;

    connection.query(q, (error, result) => {
        if (error) throw error;
        let user = result[0];
        console.log(user);                                 // These two lines are for debugging
        console.log(formPassword);                         // These two lines are for debugging
        if (user.password != formPassword.password) {
            res.send("Incorrect Password!");
        }

        else {
            let q2 = `DELETE FROM users WHERE id = '${id}'`;
            connection.query(q2, (error, result) => {
                if (error) throw error;
                else {
                    console.log(result);
                    console.log("DELETED!");
                    res.redirect('/users');
                }

            });
        }
    });

});