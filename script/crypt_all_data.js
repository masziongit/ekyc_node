const db = require('../database/dbconnection').knex
const cryptoData = require('../service.data.cryptography')

const mode = process.env.CRYPTO_MODE
const table = 'biometricData'

let whereVal = mode=='encrypt'?0:1
let updateVal = mode=='encrypt'?1:0
let limit = 2

// init log
const winston = require('winston');
require('winston-daily-rotate-file');

let transports = []

var transport = new (winston.transports.DailyRotateFile)({
    filename: '../logs/migrating/migrating-%DATE%.log',
    //datePattern: 'YYYY-MM-DD-HH',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '500m',
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

const drop = db.schema.table(table,(tableVal)=> {
    tableVal.dropColumn('ISENCRYPTED')
})

async function migration() {

const select = db(table).orderBy('timestamp', 'desc')
    .limit(limit)
    .where({ISENCRYPTED:whereVal})

    logger.debug('SQL : '+select.toString())

    await select
        .catch((err) => {
            logger.error(err)
            process.exit(0)
        })
        .then(async (data = []) => {

            let en = []
            if (data.length != 0) {
                try {
                    for (let index in data) {
                        let d = data[index]
                        let enData = await cryptoData('', d.biometricData, mode, logger)
                        en.push({id: d.biometricRefId, data: enData})
                    }
                } catch (e) {
                    process.exit(0)
                }

            }else {
                logger.info(`No data found in query`)
                logger.info(`Exit program`)

               await drop.then(()=>{
                    logger.info(`Drop SQL : ${drop.toString()}`)
                    db.commit
                })

                process.exit(0)
            }
            return en
        }).then(async en => {
        for (let index in en) {
            let d = en[index]
            update = db(table)
                .where({biometricRefId: d.id, ISENCRYPTED: whereVal})
                .update({biometricData: d.data, ISENCRYPTED:updateVal}, ['biometricRefId'])

            logger.debug('SQL : ' + update.toString())

            await update
                .catch(err => {
                    logger.error(err)
                    process.exit(0)
                })
                .then((id) => {
                    logger.info(`Update ${mode} data biometricRefId : ${id}`)
                })
        }

        // process.exit(0)
    })

}

async function loopMigration() {

    const alter = db.schema.table(table,(tableVal)=> {
        tableVal.integer('ISENCRYPTED',1).notNullable().default(0)
        db.commit
    })

    await alter.then(()=>{
        logger.info(`Alter SQL : ${alter.toString()}`)
    }).catch(async(err)=>{
        logger.error(err)
    })

    while (true){
        let loop = await migration()
    }

    process.exit(0)
}

loopMigration()



