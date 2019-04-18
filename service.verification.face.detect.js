// 1-to-1 Face Verification Service

// import dependencies
const util = require('./util.js');
const errorStatus = '1999';

const faceVerificationUrl = process.env.FACE_DETECT;

module.exports = (json) => {

    let logger = json.logger;
    let req = json.req;
    let res = json.res;

    let rquid = req.body.rquid
    let documentId = req.body.documentId

    if (util.isUndefineNullBlank(rquid) ||
        util.isUndefineNullBlank(documentId) ||
        util.isUndefineNullBlank(req.body.image) ||
        util.isUndefineNullBlank(req.body.image.app_id) ||
        // util.isUndefineNullBlank(req.body.image['content-type'])   ||
        util.isUndefineNullBlank(req.body.image.data)) {

        badRequest(logger, rquid, res)
        return;
    }

    verification(req, logger).then(rpRes => {
        let resbody = {rquid: rquid, documentId: documentId}
        logger.debug('Received verification response: ' + JSON.stringify(rpRes));
        Object.assign(resbody, rpRes);
        res.status(200).json(resbody)
    }).catch(err => {
        logger.error('Received verification response: ' + JSON.stringify(err));
        res.status(500).json(err)
    })

}

const fs = require('fs');

const verification = (req, logger) => {

    logger.debug('Received verification request: ' + JSON.stringify(req.body));

    let rp = require('request-promise');

    let hexData = Buffer.from(req.body.image.data, 'utf8').toString('hex').toUpperCase();

    req.body.image.data = hexData

    const timestamp = new Date().getTime()
    const none = Math.floor(Math.random() * 9999999);
    const sign = util.signature(timestamp + '', none + '')

    let option = {
        method: 'POST',
        uri: faceVerificationUrl,
        headers: {
            "Content-Type": "application/json",
            "x-bi-boundid": "com.paic.xface-test",
            "x-bi-timestamp": timestamp + "",
            "x-bi-none": none + "",
            "Authorization": sign,
            'Accept': 'application/json'
        },
        body: req.body,
        json: true,
        agentOptions: {
            ca: fs.readFileSync("./certt.cer")
        }
    }

    const jsonErr = {
        // rquid: req.body.rquid,
        statusCode: errorStatus,
        statusDesc: "Error",
        remark: "Internal server error"
    }

    return new Promise((resolve, reject) => {
        logger.debug('Request to External server : ' + JSON.stringify(option))
        rp(option)
            .then(body => {
                logger.debug('Response form External server : ' + JSON.stringify(body))
                resolve(body)
            })
            .catch(err => {
                logger.error('Found internal error when posting message to BMS server for rquid: '
                    + req.body.rquid);
                logger.error(err)
                reject(jsonErr)
                // console.log(err)
            });

    })
}

const badRequest = (logger, rquid, res) => {
    logger.info('Bad request for rquid: ' + rquid);
    res.statusMessage = "Bad request";
    res.status(400);
    res.send({
        statusCode: errorStatus,
        statusDesc: "Error",
        remark: "Missing input(s)"
    });
}