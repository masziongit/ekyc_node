const db = require('../database/dbconnection').knex
const cryptoData = require('../service.data.cryptography')

const mode = process.env.CRYPTO_MODE

// init log
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
});

db('biometricData').orderBy('timestamp', 'desc')
    .catch((err) => {
        throw err;
        process.exit(0)
    })
    .then(async (data = []) => {

        let en = []
        if (data.length != 0) {
            for (let index in data){
                let d = data[index]
                let enData = await cryptoData('',d.biometricData,mode,logger)
                en.push({id:d.biometricRefId,data:enData})
            }
        }
        return en
    }).then(async en=>{
        console.log(JSON.stringify(en))
        for (let index in en) {
            let d = en[index]
            update = db('biometricData')
                .where('biometricRefId','=',d.id)
                .update({
                    biometricData: d.data
                },['biometricRefId'])

            await update
                .catch(err=>{
                    throw err
                })
                .then((id)=>{
                    console.log(`Update ${mode} data biometricRefId : ${id}`)
                })
        }

        process.exit(0)
    })