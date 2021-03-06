
let rp = require('request-promise');

const encrypt = process.env.CRYPTO_HOST_ENCRYPT
const decrypt = process.env.CRYPTO_HOST_DECRYPT

let body = {
    algorithm:process.env.ALGORITHM,
    transformation:process.env.TRANSFORMATION,
    partition:process.env.PARTITION,
    alias:process.env.ALIAS,
    passPartition:process.env.PASS_PARTITION
    //mock
    // "algorithm":"AES",
    // "transformation":"AES/CBC/PKCS5Padding",
    // "partition":0,
    // "alias":"A1",
    // "passPartition":"P@ssw0rd"
}

module.exports = (rquid,data,mode,logger)=>{

    body.data = data

    let cryUri

    if (mode == "decrypt"){
        cryUri = decrypt
    }else if (mode == "encrypt") {
        cryUri = encrypt
    }

    let option = {
        method: 'POST',
        uri: cryUri,
        body : body,
        json : true
    }

    return new Promise((resolve, reject) => {
        logger.debug('Request to External server : ' + JSON.stringify(option))
        rp(option)
            .then(function (body) {
                logger.debug(' Response form External server : ' + JSON.stringify(body))
                resolve(body.result)
            })
            .catch(function (err) {
                logger.error('Found internal error when posting message to External server for rquid: ' + rquid);
                logger.error(err)
                reject(err)
                throw err
            });
    })

}


