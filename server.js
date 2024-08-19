// import express package
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { closeAll } = require('./pool-manager')
const bodyParser = require('body-parser')
const {createServer} = require('http')
require('dotenv').config() // require dotenv so nodejs can recognize .env file for environmental variables
// socket.io for live changes
const {Server} = require('socket.io')

// initialize app to handle functions
const app = express();
// server that get supplied from the app
const server = createServer(app);
// initialize instance of socket.io
const io = new Server(server);
const port = process.env.PORT;
const db = require('./db');

io.on('connection', (socket) => {
    console.log('user connected')
    socket.on('update schedule', (date) => {
        console.log('schedule updated for:');
        console.log(date)
        // broadcast for all sockets
        io.emit('updated schedule')
    })
    // send the number of users in room to client
    socket.on('student joined', function(){
        console.log('A student has joined')
        socket.join('students');
        console.log('Number of students connected:', io.sockets.adapter.rooms.get('students').size)
        // emit event to client
        io.to('students').emit('count changed', io.sockets.adapter.rooms.get('students').size);
    })
    // send the number of users in room to client
    socket.on('student left', function(){
        const room = io.sockets.adapter.rooms.get('students')
        console.log('A student has left')
        socket.leave('students');
        if(room != undefined){
            console.log('Number of students connected:', room.size)
            // emit event to client
            io.to('students').emit('count changed', room.size);
        } else {
            console.log('Room has closed')
            // emit event to client
            io.to('students').emit('count changed', 0)
        }
    })
})

// set server to port
server.listen(port, function (err) {
    if (err)
        console.log(err);
    console.log("Server listening on PORT", port);
    console.log("Using latest version")
});

// close db pools before exit (this is not being triggered by Ctrl + C)
process.on('beforeExit', async () => {
    console.log('Closing all connections...')
    await closeAll();
    process.exit(0);
})
// access static files (js and css files)
// ! IMPORTANT ALL FILES PUT IN PUBLIC DIRECTORY ARE ACCESSIBLE FROM THE FILES IN THE ROOT DIRECTORY WITHOUT SPECIFYING '/public/file', just '/file'
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
        maxAge: 12000000
    }
}))

// **** route handlers ****
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
    db.login(req.body).then(valid => {
        console.log(valid);
        if(valid){
            console.log('login success!');
            req.session.username = req.body.username;
            res.redirect('/admin');
            res.end(); // end request (!important page will load for a long time without this)
        } else {
            res.send("Login failed. <a href='/login'>Return to login.</a>");
        }
    });
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
    console.log(req.body);
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
    if(method == 'clear')
        db.clearSchedule(req.query.date)
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
app.get('/home', (req, res) => {
    res.sendFile("home.html", {root:__dirname})
})
app.get('/', (req, res) => {
    res.redirect('/home');
})
app.get('/map', (req, res) => {
    res.sendFile("map.html", {root:__dirname});
})
app.get('/accountdb', (req, res) => {
    db.getAccount().then(account => res.json(account))
})
app.post('/accountdb', (req, res) => {
    // change credentials for account
    if(req.body.type == 'password'){
        db.changePassword(req.body.newValue, req.body.oldValue).then(valid => {
            console.log(valid);
            if(!valid){
                res.json({status: 'failed'});
            } else {
                res.json({status: 'success'});
            }
        });
    } else {
        db.changeUsername(req.body.newValue);
        res.json({status: 'success'});
    }
})