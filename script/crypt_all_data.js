const db = require('../database/dbconnection').knex
const cryptoData = require('../service.data.cryptography')

const mode = process.env.CRYPTO_MODE

// init log
const winston = require('winston');
require('winston-daily-rotate-file');

let transports = []

var transport = new (winston.transports.DailyRotateFile)({
    filename: '../logs/migrating/migrating-%DATE%.log',
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
    transports.push(new (winston.transports.Console)({
        json: true,
        stringify: (obj) => JSON.stringify(obj),
    }))
}

const {splat, combine, timestamp, printf} = winston.format;

const myFormat = printf(({timestamp, level, message}) => {
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

const select = db('biometricData').orderBy('timestamp', 'desc')
    .limit(10)
    .whereNull('ISENCRYPTED')

logger.debug('SQL : '+select.toString())

select
    .catch((err) => {
        logger.error(err)
        process.exit(0)
    })
    .then(async (data = []) => {
        let en = []
        if (data.length != 0) {
            try {
                for (let index in data){
                    let d = data[index]
                    let enData = await cryptoData('',d.biometricData,mode,logger)
                    en.push({id:d.biometricRefId,data:enData})
                }
            }catch (e) {
                process.exit(0)
            }

        }
        return en
    }).then(async en=>{
        for (let index in en) {
            let d = en[index]
            update = db('biometricData')
                .where({biometricRefId:d.id,ISENCRYPTED:null})
                .update({biometricData: d.data,ISENCRYPTED:1},['biometricRefId'])

            logger.debug('SQL : '+update.toString())

            await update
                .catch(err=>{
                    logger.error(err)
                    process.exit(0)
                })
                .then((id)=>{
                    logger.debug(`Update ${mode} data biometricRefId : ${id}`)
                })
        }

        process.exit(0)
    })
