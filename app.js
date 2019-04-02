/*
 *   Company: TMB
 *   Project: e-KYC
 */

// load dependencies
const express = require('express'),
    expressWinston = require('express-winston');

const fs = require('fs');
const bodyParser = require('body-parser');
// const xml2js = require('xml2js'); // may not need
const cheerio = require('cheerio');
// const uuidv4 = require('uuid/v4');
// const mongoose = require('mongoose');
const util = require('./util.js');
const request = require('request');
const path = require('path');

// init https
const https = require('https');
let options


options = {
    ca: fs.readFileSync(process.env.SEVER_CA),
    cert: fs.readFileSync(process.env.SEVER_CERT),
    key: fs.readFileSync(process.env.SEVER_KEY)
};


// init server
var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json({
    limit: '20mb'
}));

// init log
var winston = require('winston');
require('winston-daily-rotate-file');

let transports = []

var transport = new (winston.transports.DailyRotateFile)({
    filename: './logs/application-%DATE%.log',
    //datePattern: 'YYYY-MM-DD-HH',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    json: true,
    stringify: (obj) => JSON.stringify(obj),
}).on('rotate', function (oldFilename, newFilename) {
    // do something fun
});

transports.push(transport)

if (process.env.LOG_LEVEL === 'debug'){
    // logger.add(new (winston.transports.Console)({
    //     json: true,
    //     stringify: (obj) => JSON.stringify(obj),
    // }))

    transports.push(new (winston.transports.Console)({
            json: true,
            stringify: (obj) => JSON.stringify(obj),
        }))
}

const {splat, combine, timestamp, printf} = winston.format;

const myFormat = printf(({timestamp, level, message, meta}) => {
    return `${timestamp} [${level.toString().toUpperCase()}] ${message} `;
});

var logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: combine(
        timestamp(),
        splat(),
        myFormat
    ),
    transports
});
let restLog = expressWinston.logger({
    format: combine(
        timestamp(),
        splat(),
        myFormat
    ),
    transports,
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
})


app.use(restLog);

//  variable declaration
var availableChannels = ['tmb', 'scb', 'kbank', 'ktc', 'bbl', 'bay', 'uob'];    // not being used for now
var bmsXmlTemplate;

//load db
var db = require('./database/dbconnection').knex

setInterval(function () {
    db.raw('SELECT 1 FROM DUAL').then(function (resp) {
        console.log(util.dateNow() + ` checking database connection ${JSON.stringify(resp)}`);
    }).catch(err=>{
        logger.error(err)
        throw err
    })
}, 10000);

// load services
var service = {};
service.verification = require('./service.verification.js');
service.overwrite = require('./service.verification.overwrite.js');
service.get = require('./service.biometric.get.js');
service.history = require('./service.verification.history.js');
service.passport = require('./service.passport.verification.js');
//new pA
service.verification.biodetect = require('./service.verification.biodetect.js');
service.verification.face = {}
service.verification.face.detect = require('./service.verification.face.detect.js');
service.verification.face.compare = require('./service.verification.face.compare.js');

// init services
app.post('/biometric/verification/1to1', (req, res) => {
    service.verification.oneToOne({
        logger: logger,
        req: req,
        res: res,
        db: db,
        bmsXmlTemplate: bmsXmlTemplate
    });
});

app.post('/biometric/verification/overwrite', (req, res) => {
    service.overwrite({
        logger: logger,
        req: req,
        res: res,
        db: db
    });
});

app.post('/biometric/get', (req, res) => {
    service.get({
        logger: logger,
        req: req,
        res: res,
        db: db
    });
});

app.post('/biometric/verification/history', (req, res) => {
    service.history({
        logger: logger,
        req: req,
        res: res,
        db: db
    });
});

app.post('/passport/verification', (req, res) => {
    service.passport({
        logger: logger,
        req: req,
        res: res
    });
});

app.post('/biometric/verification/biodetect', (req, res) => {
    service.verification.biodetect({
        logger: logger,
        req: req,
        res: res
    });
});

app.post('/biometric/verification/face/detect', (req, res) => {
    service.verification.face.detect({
        logger: logger,
        req: req,
        res: res
    });
});

app.post('/biometric/verification/face/compare', (req, res) => {
    service.verification.face.compare({
        logger: logger,
        req: req,
        res: res,
        db: db
    });
});

// proxy service for NEC enrolment function
app.post('/biometric/nec/enrolment', (req, res) => {
    // TODO
});

app.post('/BMSWebservice72/BMS_WebService.asmx', (req, res) => {
    logger.info(req.body)
    res.contentType('application/xml');
    res.sendFile(path.join(__dirname, 'sampleMessages', 'bms_responsePayload.xml'));
    return;
});

app.post('/passport_verification', (req, res) => {
    logger.info(util.dateNow() + ' pp ver ' + req.body)
    res.contentType('application/xml');
    res.sendFile(path.join(__dirname, 'sampleMessages', 'bms_responsePayload.xml'));

});

// START eKYC server !!!
var start = () => {
    fs.readFile('./templates/bms_1to1verification_request_template.xml', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to load BMS XML Template', err);
            logger.error(util.dateNow() + ' Failed to load BMS XML Template, closing eKYC server...');
            return;
        }
        // init jQuery-like DOM manipulator for nodejs server (used for manipulating XML)
        bmsXmlTemplate = cheerio.load(data, {
            xmlMode: true
        });
        // start http
        app.listen(8080, () => {
            console.log('eKYC HTTP server is running!');
            logger.info('eKYC HTTP server is running');
        });
        // start https
        var server = https.createServer(options, app);
        server.listen(8443, () => {
            console.log('eKYC HTTPS server is running!');
            logger.info('eKYC HTTPS server is running');
        });
    });
};
start();
