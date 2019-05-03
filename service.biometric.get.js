// Biometric Get Service: For getting biometric data

// import dependencies
const uuidv4 = require('uuid/v4');
const uuidValidator = require('uuid-validate');
const util = require('./util.js');

// constant values
const successStatus = '1000';
const successButNoDataFoundStatus = '1001';
const errorStatus = '1999';

const cryptoData = require('./service.data.cryptography')
const cryptoMode = 'decrypt'

module.exports = (json) => {
    'use strict';
    var logger = json.logger;
    var req = json.req;
    var res = json.res;
    var db = json.db

    // extract data from request
    var rquid = req.body.rquid;
    var documentId = req.body.documentId;
    var documentIdType = req.body.documentIdType;
    var biometricDataMethod = req.body.biometricDataMethod;
    var biometricDataSource = req.body.biometricDataSource;
    var channel = req.body.channel;
    var biometricRefId = req.body.biometricRefId;

    // logging
    logger.debug('Received biometric get request: ' + JSON.stringify(req.body));

    // request message validation
    let errorRemark = null;
    let condition;
    logger.debug(util.dateNow() + " biometricRefId " + biometricRefId)
    if (util.isUndefineNullBlank(rquid)) {
        logger.info('Bad request, no rquid');
        errorRemark = "Missing rquid";
    }
    if (util.isUndefineNullBlank(biometricRefId)) {
        if (util.isUndefineNullBlank(documentId)) {
            logger.info('Bad request, missing documentId for rquid: ' + rquid);
            errorRemark = "Missing documentId";
        }
        if (util.isUndefineNullBlank(documentIdType)) {
            logger.info('Bad request, missing documentIdType for rquid: ' + rquid);
            errorRemark = "Missing documentIdType";
        }
        if (util.isUndefineNullBlank(biometricDataMethod)) {
            logger.info('Bad request, missing biometricDataMethod for rquid: ' + rquid);
            errorRemark = "Missing biometricDataMethod";
        }
        if (util.isUndefineNullBlank(biometricDataSource)) {
            logger.info('Bad request, missing biometricDataSource for rquid: ' + rquid);
            errorRemark = "Missing biometricDataSource";
        }
        if (util.isUndefineNullBlank(channel)) {
            logger.info('Bad request, missing channel for rquid: ' + rquid);
            errorRemark = "Missing channel";
        }
    }
    if (errorRemark != null) {
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            rquid: "",
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: errorRemark
        });
        return;
    }
    if (util.isUndefineNullBlank(biometricRefId)) {
        logger.info(util.dateNow() + " biometricRefId is null")
        condition = {
            documentId: documentId,
            documentIdType: documentIdType,
            biometricDataMethod: biometricDataMethod,
            biometricDataSource: biometricDataSource,
            channel: channel
        };
    } else {
        condition = { biometricRefId: biometricRefId }
    }

    logger.debug(condition)

    // query biometric data
    db('biometricData')
        .where(condition).orderBy('timestamp', 'desc').limit(1)
        .catch((err) => {
            logger.error('Internal server error for rquid: ' + rquid);
            logger.error(err.toString());
            res.status(500);
            res.json({
                rquid: rquid,
                statusCode: errorStatus,
                statusDesc: "Error",
                remark: "Internal server error"
            });
        })
        .then(async (document = []) => {
            var json;
            if (document.length == 0) {
                logger.info('No biometric data found for rquid: ' + rquid);
                json = {
                    rquid: rquid,
                    statusCode: successButNoDataFoundStatus,
                    statusDesc: "Success",
                    remark: "No data found",
                    biometricData: "",
                    biometricDataMethod: "",
                    biometricDataFormat: "",
                    biometricDataSource: "",
                    timestamp: "",
                    channel: ""
                };
            } else {
                logger.info('Found biometric data for rquid: ' + rquid);
                json = {
                    rquid: rquid,
                    statusCode: successStatus,
                    statusDesc: "Success",
                    remark: "Data found",
                    biometricData: document[0].biometricData,
                    biometricDataMethod: document[0].biometricDataMethod,
                    biometricDataFormat: document[0].biometricDataFormat,
                    biometricDataSource: document[0].biometricDataSource,
                    timestamp: document[0].timestamp,
                    channel: document[0].channel
                };

                json.biometricData = await cryptoData(rquid,json.biometricData,cryptoMode,logger)
            }
            res.send(json);
        });

};
