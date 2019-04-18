//Oracle knex
require('dotenv').config()
var crypto = require('crypto')
module.exports.knex = require('knex')({
    client: 'oracledb',
    debug: false,
    connection: {
        "user": process.env.DB_USER,
        "password": decrypt(process.env.DB_PASSWORD),
        "connectString": process.env.DB_CONNECT_STRING,
    },
    pool: {
        acquireTimeout: 2000,
        requestTimeout: 5000,
        syncInterval: 2000,
        min: 1
    },
    fetchAsString: ['number','clob']
});


function decrypt(text){
  var algorithm = 'aes-256-cbc';
  var password = 'jwJ3j6bvHEtRrHUpbtf1';
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
// const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017');  // local
// mongoose.connect('mongodb://10.209.23.226:27017'); // RH linux SIT
// var db = mongoose.connection;
// db.on('error', (err) => {
//     logger.error(util.dateNow()+ ' - Error when connecting to mongoDb: ' + err + ' ... closing eKYC server...');
//     console.log('Error when connecting to mongoDb: ' + err + ' ... closing eKYC server...');
//     console.error.bind(console, 'connection error:');
//     process.exit();
// });
// db.once('open', function () {
//     'use strict';
//     logger.info(util.dateNow()+ ' - The server is conneted to MongoDB');
//     console.log(' The server is conneted to MongoDB');
// });


