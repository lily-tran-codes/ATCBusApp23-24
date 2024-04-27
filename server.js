// import express package
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser')
require('dotenv').config() // require dotenv so nodejs can recognize .env file for environmental variables

const app = express();
const port = process.env.PORT;
const db = require('./db');

// set server to port
app.listen(port, function (err) {
    if (err)
        console.log(err);
    console.log("Server listening on PORT", port);
});

// access static files (js and css files)
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('trust proxy', 1);
// middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1*60*60*1000
    }
}))
// serve HTML page (GET)
app.get('/admin', (req, res) => {
    if(req.session.username == null){
        res.redirect("/login");
     } else {
         res.sendFile("admin.html", {root:__dirname});
    }
});
app.get('/login', (req, res) => {
    res.sendFile("login.html", {root:__dirname});
})
app.post('/login', (req, res) => {
    if(req.body.username == process.env.ADMIN_LOGIN_NAME && req.body.password == process.env.ADMIN_LOGIN_PASS){
        console.log('login success!');
        req.session.username = req.body.username;
        res.redirect('/admin');
        res.end(); // end request (!important page will load for a long time without this)
    } else {
        for(var i = 0; i < 5; i++){
            res.send('Login failed.');
        }
    }
})
app.get('/db', (req, res) => {
    var table = req.query.table;
    var user = req.query.user;
    var date = req.query.date;
    if (table == 'scheduledBuses'){
        if(user == 'student'){
            db.getStudentSchedule(date).then(schedule => res.json(schedule));
        } else {
            db.getSchedule(date).then(buses => res.json(buses));
        }
    }
    if (table == 'buses')
        db.getBuses().then(buses => res.json(buses))
});
app.post('/db', (req, res) => {
    const method = req.query.method
    if(method == 'add')
        db.addBus(req.body);
    if(method == 'edit')
        db.editBus(req.body);
    if(method == 'archive')
        db.archiveList();
    if(method == 'update')
        db.updateSchedule(req.body, req.query.date);
    if(method == 'schedule')
        db.writeSchedule(req.query.date, req.body);
    res.end();
})
app.delete('/db', (req, res) => {
    db.deleteBus(req.body);
    res.end();
})
app.get('/admin/buses', (req, res) => {
    if(req.session.username == null){
        res.redirect('/login');
    }else{
        res.sendFile("buses.html", {root:__dirname});
    }
})
app.get('/admin/account', (req, res) => {
    if(req.session.username == null){
        res.redirect('/login');
    }else{
        res.sendFile("account.html", {root:__dirname});
    }
})
app.get('/', (req, res) => {
    res.sendFile("home.html", {root:__dirname})
})
app.get('/accountdb', (req, res) => {
    // db.getAccount().then(account => res.json(account));
    res.json([{username:process.env.ADMIN_LOGIN_NAME, password:process.env.ADMIN_LOGIN_PASS}])
})
// app.post('/userlogin', (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
    // validate login data
//     console.log("login info:");
//     console.log(username);
//     console.log(password);
// })