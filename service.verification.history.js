// History Service: For getting verification history

// import dependencies
const uuidv4 = require('uuid/v4');
const uuidValidator = require('uuid-validate');
const util = require('./util.js');

// constant values
const successStatus = '1000';
const successButNoDataFoundStatus = '1001';
const errorStatus = '1999';

module.exports = (json) => {
    'use strict';
    var logger = json.logger;
    var res = json.res;
    var req = json.req;
    var db = json.db

    // logging
    logger.debug('Received get history request: ' + JSON.stringify(req.body));

    // extract data from request
    var rquid = req.body.rquid;
    var documentId = req.body.documentId;
    var biometricDataSource = req.body.biometricDataSource;
    var all = req.body.all;

    // request msg validation
    if (rquid === undefined || rquid === null || rquid === '') {
        logger.info('Bad request, no rquid');
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            rquid: "",
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: "Missing rquid"
        });
        return;
    } else if (documentId === undefined || documentId === null || documentId === '') {
        logger.info('Bad request, missing documentId for rquid: ' + rquid);
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            rquid: rquid,
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: "Error: Missing documentId"
        });
        return;
    }
    else if (biometricDataSource === undefined || biometricDataSource === null || biometricDataSource === '') {
        logger.error('Bad request, missing biometricDataSource for rquid: ' + rquid);
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            rquid: rquid,
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: "Error: Missing biometricDataSource"
        });
        return;
    }

    // var condition = { resultCode: { $in: [0, 1] }, documentId: documentId }


    let query = db.select([
        'verificationHistoryData.verificationRefId as verificationRefId',
        'verificationHistoryData.documentId as documentId',
        'verificationHistoryData.documentIdType as documentIdType',
        'verificationHistoryData.timestamp as timestamp',
        'verificationHistoryData.resultCode as resultCode',
        'verificationHistoryData.resultDesc as resultDesc',
        'verificationHistoryData.totalScore as totalScore',
        'verificationHistoryData.documentIdType as verificationHistoryDocumentIdType',
        'verificationHistoryData.verificationMethod as verificationMethod',
        'verificationHistoryData.primaryBiometricDataRefId as primaryBiometricDataRefId',
        'verificationHistoryData.secondaryBiometricDataRefId as secondaryBiometricDataRefId',
        'verificationHistoryData.primaryBiometricDataMethod as primaryBiometricDataMethod',
        'verificationHistoryData.secondaryBiometricDataMethod as secondaryBiometricDataMethod',
        'verificationHistoryData.channel as channel',
        'overwriteByData.matchResult as matchResult',
        'overwriteByData.overwriteByStaffId as overwriteByStaffId',
        'overwriteByData.timestamp as overwriteTimestamp'
        ])
        .from('verificationHistoryData')
        .leftJoin('overwriteByData',  'verificationHistoryData.verificationRefId', 'overwriteByData.verificationRefId')
        .where({'verificationHistoryData.documentId': documentId}).whereIn('verificationHistoryData.resultCode', [0,1])
        .orderBy('verificationHistoryData.timestamp','desc')

    // query verification history
    if (util.isUndefineNullBlank(all)) {
        query = query.limit(1)
    } else if (all == true) {
        // do nothing
    }
    query
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
        }).then((documents=[]) => {
        if (documents.length == 0) {
            logger.info('No verification history found for rquid: ' + rquid);
            var json = {
                rquid: rquid,
                statusCode: successButNoDataFoundStatus,
                statusDesc: "Success",
                remark: "No data found",
                documentId: documentId,
                documentIdType: "",
                timestamp: "",
                resultCode: "",
                resultDesc: "",
                score: "",
                docType: "",
                verificationMethod: "",
                overwriteBy: "",
                overwriteMatchResult: ""
            };
            res.send(json);
        } else {
            logger.info('Found verification history for rquid: ' + rquid);

            if (documents.length > 1) {
                let results = []
                documents.forEach(function (document) {
                    results.push(successResponse(logger, rquid, successStatus, documentId, document));
                });
                res.header('X-Total-Count', documents.length).send(results)
            } else {
                let json = successResponse(logger, rquid, successStatus, documentId, documents[0])
                res.send(json)
            }



        }
    })
    // var VerificationHistoryData = mongoose.model("VerificationHistoryData", verificationHistoryDataSchema);
    // VerificationHistoryData.
    // find(condition).
    // sort("-timestamp").
    // limit(1).
    // select('verificationRefId documentIdType timestamp totalScore resultCode resultDesc channel verificationMethod primaryBiometricDataMethod secondaryBiometricDataMethod primaryBiometricDataRefId secondaryBiometricDataRefId channel').
    // exec((err, document) => {
    //     if(err){
    //         logger.error('Internal server error for rquid: ' + rquid);
    //         logger.error(err);
    //         res.status(500);
    //         res.json({
    //             rquid: rquid,
    //             statusCode: errorStatus,
    //             statusDesc: "Error",
    //             remark: "Internal server error"
    //         });

    //     }else{
    //         if (document.length == 0) {
    //             logger.info('No verification history found for rquid: ' + rquid);
    //             var json = {
    //                 rquid: rquid,
    //                 statusCode: successButNoDataFoundStatus,
    //                 statusDesc: "Success",
    //                 remark: "No data found",
    //                 documentId: documentId,
    //                 documentIdType: "",
    //                 timestamp: "",
    //                 resultCode: "",
    //                 resultDesc: "",
    //                 score: "",
    //                 docType: "",
    //                 verificationMethod: "",
    //                 overwriteBy: "",
    //                 overwriteMatchResult: "",
    //             };
    //             res.send(json);
    //         } else {
    //             logger.info('Found verification history for rquid: ' + rquid);
    //             checkOverwrite(
    //                 logger,
    //                 mongoose,
    //                 overwriteByDataSchema,
    //                 rquid,
    //                 documentId,
    //                 document,
    //                 res
    //             );
    //         }

    //     }
    // });
};

checkOverwrite = (logger, mongoose, overwriteByDataSchema, rquid, documentId, document, res) => {
    // query overwrite history
    var overwriteByData = mongoose.model("overwriteByData", overwriteByDataSchema);
    overwriteByData.
    find({
        verificationRefId: document[0].verificationRefId
    }).
    sort("-timestamp").
    limit(1).
    select('matchResult remark timestamp overwriteByStaffId overwriteByStaffName channel branchCode').
    exec((err, overwriteDocument) => {
        if(err){
            logger.error('Internal server error for rquid: ' + rquid);
            logger.error(err);
            res.status(500);
            res.json({
                rquid: rquid,
                statusCode: errorStatus,
                statusDesc: "Error",
                remark: "Error: Internal server error"
            });

        }else{
            var json;
            if (overwriteDocument.length == 0) {
                logger.info('No overwrite data found for rquid: ' + rquid);
                json = successResponse(rquid, successStatus, documentId, document);
            } else {
                logger.info('Found overwrite data for rquid: ' + rquid);
                json = successResponse(
                    rquid,
                    successStatus,
                    documentId,
                    document,
                    overwriteDocument[0].overwriteByStaffName,
                    overwriteDocument[0].matchResult
                );
            }
            res.send(json);
        }
    });
};

successResponse = (logger, rquid, successStatus, documentId, document) => {
    logger.debug("Before response - " + JSON.stringify(document));
    return {
        rquid: rquid,
        statusCode: successStatus,
        statusDesc: "Success",
        remark: "Data found",
        verificationRefId: document.verificationRefId,
        documentId: documentId,
        documentIdType: document.verificationHistoryDocumentIdType,
        timestamp: document.timestamp,
        resultCode: document.resultCode,
        resultDesc: document.resultDesc,
        score: document.totalScore.toString(),
        docType: document.primaryBiometricDataMethod + " + " + document.secondaryBiometricDataMethod,
        verificationMethod: document.verificationMethod,
        overwriteBy: util.isUndefineNullBlank(document.overwriteByStaffId) ? "" : document.overwriteByStaffId,
        overwriteMatchResult: util.isUndefineNullBlank(document.matchResult) ? "" : document.matchResult,
        overwriteTimestamp: util.isUndefineNullBlank(document.overwriteTimestamp) ? "" : document.overwriteTimestamp,
        primaryBiometricDataRefId: document.primaryBiometricDataRefId,
        secondaryBiometricDataRefId: document.secondaryBiometricDataRefId,
        channel: document.channel
    };
}
