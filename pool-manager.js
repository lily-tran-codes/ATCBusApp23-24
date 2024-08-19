const mssql = require('mssql');
const pools = new Map();
// to read .env file
require('dotenv').config();
/* define configs */
const adminConfig = {
    server: process.env.SERVER, // !IMPORTANT: for every backslash (\), be sure to change to 2 backward slashes (\\) as backward slash is an escape character in JS
    database: 'BusDismissal',
    user: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    port: 1433,
    trustServerCertificate: true,
    pool: {
        max: 5,
        min: 1,
    },
}

const studentConfig = {
    server: process.env.SERVER,
    database: 'BusDismissal',
    user: process.env.STUDENT_USERNAME,
    password: process.env.STUDENT_PASSWORD,
    port: 1433,
    trustServerCertificate: true,
    pool: {
        max: 50,
        min: 1,
    },
};

/* create pools */
pools.set('admin', new mssql.ConnectionPool(adminConfig));
pools.set('student', new mssql.ConnectionPool(studentConfig))

module.exports = {
    get: (name, config) => {
        if(!pools.has(name)){
            if(!config){
                throw new Error('Pool does not exist')
            }
            const pool = new mssql.ConnectionPool(config);
            const close = pool.close.bind(pool);
            pool.close = (...args) => {
                pools.delete(name);
                return close(...args);
            }
            pools.set(name, pool.connect());
        }
        return pools.get(name);
    },
    /* close all pools and remove from store */
    closeAll: () => Promise.all(Array.from(pools.values()).map((connect) => {
        return connect.then((pool) => pool.close())
    }))
}