const sql = require('mssql');
// require('dotenv').config();
const bcrypt = require('bcrypt');
require('dotenv').config();

// db config for local development
// const adminConfig = {
//     server: '10.19.201.210\\SQLEXPRESS',
//     database: 'BusDismissal',
//     user: process.env.LOCAL_ADMIN_USERNAME,
//     password: process.env.LOCAL_ADMIN_PASSWORD,
//     port: 1433,
//     trustServerCertificate: true
// };
// const studentConfig = {
//     server: '10.19.201.210\\SQLEXPRESS',
//     database: 'BusDismissal',
//     user: process.env.LOCAL_STUDENT_USERNAME,
//     password: process.env.LOCAL_STUDENT_PASSWORD,
//     port: 1433,
//     trustServerCertificate: true
// }
// db config for school server
const adminConfig = {
    server: 'techpinnvs2.browardschools.local\\sql1', // !IMPORTANT: for every backslash (\), be sure to change to 2 backward slashes (\\) as backward slash is an escape character in JS
    database: 'BusDismissal',
    user: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    port: 1433,
    trustServerCertificate: true
}
const studentConfig = {
    server: 'techpinnvs2.browardschools.local\\sql1',
    database: 'BusDismissal',
    user: process.env.STUDENT_USERNAME,
    password: process.env.STUDENT_PASSWORD,
    port: 1433,
    trustServerCertificate: true
};

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
async function login(username, pw){
    try{
        // create connection pool to db
        var conn = new sql.ConnectionPool(adminConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        // generate salt and hash password (salt is used to attach random string to hashed password)
        const hash = await bcrypt.hash(pw, 10);
        console.log(hash);
        // query results from db
        // const res = await req.query(`USE BusDismissal; INSERT INTO users(username, password) VALUES(${username}, ${hash});`);
        
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
        const notes = await req.query(`USE BusDismissal; SELECT notes FROM Schedules WHERE schedule_date='${date}'`);
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
        var conn = new sql.ConnectionPool(studentConfig);
        var req = new sql.Request(conn);
        // connect to db
        const db = await conn.connect();
        const account = await req.query(`USE BusDismissal; SELECT username, password FROM Accounts WHERE active=1`);
        console.log(account.recordset);
        return account.recordset
   } catch (err) {
       // handles errors
       console.log("An error has occured: ", err);
   } finally {
       // close connection to db
       conn.close();
   }
}

module.exports = { getSchedule, getBuses, addBus, deleteBus, editBus, archiveList, updateSchedule, login, writeSchedule, getStudentSchedule, getAccount}