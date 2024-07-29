const sql = require('mssql');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
// to read .env file
require('dotenv').config();

// database configuration
const adminConfig = {
    server: process.env.SERVER, // !IMPORTANT: for every backslash (\), be sure to change to 2 backward slashes (\\) as backward slash is an escape character in JS
    database: 'BusDismissal',
    user: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    port: 1433,
    trustServerCertificate: true
}
const studentConfig = {
    server: process.env.SERVER,
    database: 'BusDismissal',
    user: process.env.STUDENT_USERNAME,
    password: process.env.STUDENT_PASSWORD,
    port: 1433,
    trustServerCertificate: true
};
// encryption middleware class
class Middleware{
    // create secret key on initialization of object
    constructor(){
        this.secretKey = process.env.SECRET_KEY; // key length is dependent on algorithm (aes256 uses 32 bytes)
    }

    encrypt(data) {
        console.log(process.env.SECRET_KEY.length);
        // generate 16-byte initialization vector (IV)
        const iv = crypto.randomBytes(16);
        // create cipher
        const cipher = crypto.createCipheriv("aes-256-cbc", this.secretKey, iv);
        // update cipher with data to encrypt, encode as hex
        var encrypted = cipher.update(data, "utf8", "hex");
        // finalize encryption
        encrypted += cipher.final("hex");
        // return object with IV and encrypted data
        return {iv: iv.toString("hex"), encrypted};
    }

    decrypt(data){
        console.log("data:");
        console.log(data);
        // create decipher
        const decipher = crypto.createDecipheriv("aes-256-cbc", this.secretKey, Buffer.from(data.iv, "hex"));
        // update cipher with encrypted data
        let decryptedData = decipher.update(data.encrypted, "hex", "utf-8");
        // finalize decryption
        decryptedData += decipher.final("utf-8");
        return decryptedData;
    }
}

const middleware = new Middleware();

async function getSchedule(date){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // get schedule
        const scheduleRes = await req.query(`USE BusDismissal; \
        SELECT sb.schedule_date, b.bus_route, sb.bus_group, sb.bus_position, b.active
        FROM Scheduled_Buses sb JOIN Buses b
        ON sb.bus_id = b.id
        WHERE schedule_date ='${date}'
        ORDER BY b.bus_route;`);
        var active = true;
        if (scheduleRes.recordset.length > 0)
            active = scheduleRes.recordset[0].active
        const info = await req.query(`SELECT release_time, notes FROM Schedules WHERE schedule_date = '${date}'`);
        var infoData = [];
        if(info.recordset.length > 0){
            infoData = info.recordset;
        }
        if(active){
            // get buses that are not in schedule to display on bus holder
            const busRes = await req.query(`USE BusDismissal; \
            SELECT * FROM Buses b \
            WHERE NOT EXISTS (SELECT * FROM Scheduled_Buses sb WHERE b.id = sb.bus_id AND schedule_date ='${date}') AND active = 1 ORDER BY b.bus_route;`);
            return {buses : busRes.recordset, schedule : scheduleRes.recordset, info : infoData};
        }
        // return results
        return {buses : [], schedule : scheduleRes.recordset, info : infoData};
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
// function to get bus routes for a list of buses
async function getBuses(){
    try{
         // create connection pool to db
         var conn = new sql.ConnectionPool(adminConfig);
         var req = new sql.Request(conn);
         // connect to db
         const db = await conn.connect();
         // query results from db
         const res = await req.query("USE BusDismissal; \
         SELECT * FROM Buses \
         WHERE active=1 \
         ORDER BY bus_route;"); // get active buses (buses that are in the current school year)
         // assign query result to array
         const buses = res.recordset;
         // return results
         return buses
    } catch (err) {
        // handles errors
        console.log("An error has occured: ", err);
    } finally {
        // close connection to db
        conn.close();
    }
}
// function to add new bus to db table
async function addBus(bus){
    try{
        const route = bus.route;
        const update = bus.update;
        const query = `USE BusDismissal;\
        INSERT INTO Buses(bus_route, update_date, active)\
        VALUES ('${route}', '${update}', 1);\
        UPDATE Buses SET update_date = '${update}' WHERE active = 1;`;
        console.log(query);
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // run insert and update query
        await req.query(`${query} UPDATE Buses SET update_date = '${update}' WHERE active = 1;`);
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

// function to delete bus route from list
async function deleteBus(bus){
    console.log(bus);
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // query results from db
        const res = await req.query(`USE BusDismissal; DELETE FROM Buses WHERE bus_route = '${bus.route}' AND active = 1;`); // get active buses (buses that are in the current school year)
        // assign query result to array
        const buses = res.recordset;
        // return results
        return buses
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

// function to edit bus in db
async function editBus(bus){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // query results from db
        const res = await req.query(`USE BusDismissal; UPDATE Buses SET bus_route = '${bus.updatedRoute}' WHERE bus_route = '${bus.initRoute}'`); // get active buses (buses that are in the current school year)
        // assign query result to array
        const buses = res.recordset;
        // return results
        return buses
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
async function archiveList(){
    console.log("archive")
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // query results from db
        const res = await req.query("USE BusDismissal; UPDATE Buses SET active = 0 WHERE active = 1;"); // get active buses (buses that are in the current school year)
        // assign query result to array
        const buses = res.recordset;
        // return results
        return buses
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
// function to edit bus in db
async function updateSchedule(buses, date){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // query results from db
        var res = await req.query(`USE BusDismissal; SELECT * FROM Schedules WHERE schedule_date = '${date}';`);
        if(res.recordset.length == 0)
            await req.query(`USE BusDismissal; INSERT INTO Schedules(schedule_date) VALUES ('${date}');`);
        conn.close();
        buses.forEach(async function(bus){
            // create connection pool to db
            var conn = new sql.ConnectionPool(adminConfig);
            var req = new sql.Request(conn);
            // connect to db
            const db = await conn.connect();
            console.log(bus);
            const route = bus.route;
            const group = bus.group;
            const position = bus.position;
            var exists = await req.query(`USE BusDismissal; SELECT * FROM Scheduled_Buses WHERE bus_id = (SELECT id FROM Buses WHERE bus_route = '${route}' AND active = 1) AND schedule_date = '${date}'`);
            if(exists.recordset.length == 0){
                console.log("need to create a new record!");
                await req.query(`USE BusDismissal; INSERT INTO Scheduled_Buses(bus_id, schedule_date, bus_group, bus_position) \
                VALUES( \
                    (SELECT id FROM Buses WHERE bus_route = '${route}' AND active = 1),
                    '${date}',
                    '${group}',
                    '${position}'
                );\n`);
            } else {
                await req.query(` USE BusDismissal; UPDATE Scheduled_Buses \
                SET bus_group = '${group}', bus_position = '${position}' \
                WHERE bus_id = (SELECT id FROM Buses WHERE bus_route = '${route}' AND active = 1);\n`);
            }
            conn.close();
        })
        console.log("SAVED");
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
// function to login user
async function login(creds){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // query results from db
        console.log("server logging in")
        console.log(creds);
        var accounts = await req.query(`USE BusDismissal; SELECT * FROM Accounts;`);
        if(accounts.recordset.length == 0){
            console.log('no accounts');
            return creds.username == process.env.DEFAULT_ADMIN_LOGIN_NAME && creds.password == process.env.DEFAULT_ADMIN_LOGIN_PASS ? true : false
        } else {
            console.log('accounts found');
            accounts = await req.query(`USE BusDismissal; SELECT * FROM Accounts WHERE username = '${creds.username}'`);
            if(accounts.recordset.length == 0)
                return false;
            try{
                const valid = await bcrypt.compare(creds.password, accounts.recordset[0].password);
                console.log("passwords match: " + valid);
                if(valid)
                    return true;
            } catch {
                return false;
            }
        }        
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
async function writeSchedule(date, data){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        var query = '';
        var type = data.type == 'time' ? 'release_time' : 'notes';
        console.log(type);
        // generate salt and hash password (salt is used to attach random string to hashed password)
        const schedule = await req.query(`USE BusDismissal; SELECT * FROM Schedules WHERE schedule_date = '${date}'`);
        if( schedule.recordset.length == 0){
            query = `USE BusDismissal; INSERT INTO Schedules(schedule_date, release_time, notes) VALUES('${date}', '${time}', '${notes}')`
        } else {
            query = `USE BusDismissal; UPDATE Schedules SET ${type}='${data.info}' WHERE schedule_date = '${date}'`
        }
        console.log("query to run: ")
        console.log(query);
        // run query
        await req.query(query);
        console.log('INFO SAVED');
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
// function to get schedule in student view
async function getStudentSchedule(date){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(studentConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        const schedule = await req.query(`USE BusDismissal; SELECT b.bus_route, sb.bus_group, sb.bus_position \
        FROM Scheduled_Buses sb, Buses b \
        WHERE sb.bus_id = b.id \
        AND sb.schedule_date = '${date}';`)
        console.log(schedule.recordset);
        const notes = await req.query(`USE BusDismissal; SELECT notes FROM Schedules WHERE schedule_date='${date}';`);
        return {schedule : schedule.recordset, notes : notes.recordset}
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

// function to get admin account
async function getAccount(){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        var pw = '';
        // connect to db
        const db = await conn.connect();
        const account = await req.query(`USE BusDismissal; SELECT username, password FROM Accounts;`);
        console.log("account from database: ");
        console.log(account.recordset);
        if(account.recordset.length == 0){
            console.log("no accounts");
            return {username : process.env.DEFAULT_ADMIN_LOGIN_NAME, password : process.env.DEFAULT_ADMIN_LOGIN_PASS};
        } else {
            return {username : account.recordset[0].username, password : account.recordset[0].password};
        }
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

// function to change password
async function changePassword(newValue, oldValue){
        try{
            // create connection pool to db
            var conn = new sql.ConnectionPool(adminConfig);
            var req = new sql.Request(conn);
            var pw = '';
            // connect to db
            const db = await conn.connect();
            // check if old passwords match
            const oldPw = await req.query(' USE BusDismissal; SELECT password FROM accounts');
            console.log(oldValue);
            // check if account exists in database
            if(oldPw.recordset.length > 0){
                // compare old password entered and the hashed password from the database
                var valid = await bcrypt.compare(oldValue, oldPw.recordset[0].password);
                // if old passwords don't match return false
                if(!valid){
                    return false;
                } else {
                    // hash password
                    var hashPw = await bcrypt.hash(newValue, 10);
                    // change password in database
                    await req.query(`USE BusDismissal; UPDATE Accounts SET password = '${hashPw}'`);
                    console.log('password updated');
                }
            // if account doesn't exist   
            } else {
                // check if old password entered matches default admin password
                if(oldValue != process.env.DEFAULT_ADMIN_LOGIN_PASS){
                    return false;
                } else {
                    // hash password
                    var hashPw = await bcrypt.hash(newValue, 10);
                    // create new account in db
                    await req.query(`USE BusDismissal; INSERT INTO Accounts(username, password) VALUES('${process.env.DEFAULT_ADMIN_LOGIN_NAME}', '${hashPw}')`);
                    console.log('new account with new password created');
                }
            }
            return true;
       } catch (err) {
           // handles errors
           console.log("An error has occured: ", err);
       } finally {
           // close connection to db
           conn.close();
       }
}

// function to change account's credentials
async function changeUsername(newValue){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        var query = '';
        console.log(query);
        const accounts = await req.query(`USE BusDismissal; SELECT * FROM Accounts;`);
        console.log(newValue);
        if(accounts.recordset.length == 0){
                console.log('insert new row')
                const hashedPw = await bcrypt.hash(process.env.DEFAULT_ADMIN_LOGIN_PASS, 10);
                query = `INSERT INTO Accounts(username, password) VALUES('${newValue}', '${hashedPw}')`;
        } else {
            query = `USE BusDismissal; UPDATE Accounts SET username = '${newValue}';`;
        }
        await req.query(query);
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

async function clearSchedule(date){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        await req.query(`USE BusDismissal; DELETE FROM Scheduled_Buses WHERE schedule_date='${date}'; DELETE FROM Schedules WHERE schedule_date='${date}';`);
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}
module.exports = { getSchedule, getBuses, addBus, deleteBus, editBus, archiveList, updateSchedule, login, writeSchedule, getStudentSchedule, getAccount, changeUsername, changePassword, clearSchedule }