// Overwrite Service: For overwrite matching result by supervisor at branch

// variables
const uuidv4 = require('uuid/v4');
const uuidValidator = require('uuid-validate');
const util = require('./util.js');

const successStatus = '1000';
const successButNoDataFoundStatus = '1001';
const errorStatus = '1999';

module.exports = async (json) => {
    'use strict';
    var logger = json.logger;
    var req = json.req;
    var res = json.res;
    var db = json.db;

    // extract data from request
    var rquid = req.body.rquid;
    var verificationRefId = req.body.verificationRefId; // check if verification Id exists
    var matchResult = req.body.matchResult;
    var overwriteByStaffId = req.body.overwriteByStaffId;
    var overwriteByStaffName = req.body.overwriteByStaffName;
    var remark = req.body.remark;
    var channel = req.body.channel;
    var branchCode = req.body.branchCode;

    // logging
    logger.debug('Received overwrite request: ' + JSON.stringify(req.body));

    // request msg validation
    let errorRemark = null;
    if (util.isUndefineNullBlank(rquid)) {
        logger.info('Bad request, no rquid ');
        errorRemark = "Missing rquid";
    } else if (util.isUndefineNullBlank(verificationRefId)) {
        logger.info('Bad request, missing verificationRefId for rquid: ' + rquid);
        errorRemark = "Error: Missing verificationRefId";
    } else if (util.isUndefineNullBlank(matchResult)) {
        logger.info('Bad request, missing matchResult for rquid: ' + rquid);
        errorRemark = "Error: Missing matchResult";
    } else if (!(matchResult === "Y" || matchResult === "N")) {
        logger.info('Bad request, invalid matchResult value for rquid: ' + rquid);
        errorRemark = "Error: Invalid matchResult value";
    } else if (remark === undefined || remark === null) {
        logger.info('Bad request, missing remark for rquid: ' + rquid);
        errorRemark = "Error: Missing remark";
    } else if (overwriteByStaffId === undefined || overwriteByStaffId === null || overwriteByStaffId === '') {
        logger.info('Bad request, missing overwriteByStaffId for rquid: ' + rquid);
        errorRemark = "Error: Missing overwriteByStaffId";
    } else if (overwriteByStaffName === undefined || overwriteByStaffName === null || overwriteByStaffName === '') {
        logger.info('Bad request, missing overwriteByStaffName for rquid: ' + rquid);
        errorRemark = "Error: Missing overwriteByStaffName";
    } else if (channel === undefined || channel === null || channel === '') {
        logger.info('Bad request, missing channel for rquid: ' + rquid);
        errorRemark = "Error: Missing channel";
    } else if (branchCode === undefined || branchCode === null || branchCode === '') {
        logger.info('Bad request, missing branchCode for rquid: ' + rquid);
        errorRemark = "Error: Missing branchCode";
    }
    if (errorRemark != null) {
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            rquid: rquid,
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: errorRemark
        });
        return;
    }

    // query
    await db.select('verificationRefId')
        .from('verificationHistoryData')
        .where({verificationRefId: verificationRefId})
        .orderBy('timestamp', 'desc').limit(1)
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
        }).then((document) => {
            if (document.length == 0) {
                logger.info('No verification history found for rquid: ' + rquid);
                var json = {
                    rquid: rquid,
                    statusCode: successButNoDataFoundStatus,
                    statusDesc: "Success",
                    remark: "No verification history found to be overwritten"
                };
                res.send(json);
            } else {
                logger.info('Found verification history for rquid: ' + rquid);
                record({
                    req: req,
                    res: res,
                    logger: logger,
                    db: db
                });
            }
        });
};

record = async (json) => {
    var req = json.req;
    var res = json.res;
    var logger = json.logger;
    var db = json.db

    // extract data from request
    // the data has already been validated
    var rquid = req.body.rquid;
    var verificationRefId = req.body.verificationRefId; // check if verification Id exists
    var overwriteByStaffName = req.body.overwriteByStaffName;
    var matchResult = req.body.matchResult;
    var remark = req.body.remark;
    var overwriteByStaffId = req.body.overwriteByStaffId;
    var channel = req.body.channel;
    var branchCode = req.body.branchCode;

    // record overwriteBy data
    var overwriteByRefId = uuidv4();
    var currentUnixTime = Date.now(); // Unix timestamp - Important variable !!!
    var currentDate = new Date(currentUnixTime);

    var data = {
        overwriteByRefId: overwriteByRefId,
        verificationRefId: verificationRefId,
        matchResult: matchResult, // Y or N
        remark: remark,
        timestamp: currentUnixTime,
        date: currentDate,
        overwriteByStaffId: overwriteByStaffId,
        overwriteByStaffName: overwriteByStaffName,
        channel: channel,
        branchCode: branchCode
    };
    await db('overwriteByData').insert(data)
        .catch((err) => {
            logger.error('Internal server error for rquid: ' + rquid);
            logger.error(err.toString());
            res.status(500);
            res.json({
                rquid: rquid,
                statusCode: "111",
                statusDesc: "Error",
                remark: "Internal server error"
            });
        }).then(() => {
            logger.info('Overwrite data has been saved for rquid: ' + rquid);
            var json = {
                rquid: rquid,
                statusCode: successStatus,
                statusDesc: "Success",
                remark: "Overwrite successful"
            };
            res.send(json);

        });
};
