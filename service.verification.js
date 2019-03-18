// 1-to-1 Face Verification Service

// import dependencies
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
const uuidValidator = require('uuid-validate');
const request = require('request');
const util = require('./util.js');

// variables
const contentTypeTextXml = 'text/xml';
// BMS url, the sv accepts only SOAP XML
const necFaceVerificationUrl = process.env.BMS_HOST;
const verificationMethod = 'face';
const successStatus = '1000';
const errorStatus = '1999';

exports.oneToOne = (json) => {
    'use strict';
    var logger = json.logger;
    var req = json.req;
    var res = json.res;
    var db = json.db;
    var bmsXmlTemplate = json.bmsXmlTemplate;

    // validating req
    var rquid = req.body.rquid;
    var documentId = req.body.documentId;
    var documentIdType = req.body.documentIdType.toLowerCase(); // cid or passport
    var verificationMethod = req.body.verificationMethod;
    var primaryBiometricData = req.body.primaryBiometricData;
    var primaryBiometricDataLength = req.body.primaryBiometricDataLength;
    var primaryBiometricDataMethod = req.body.primaryBiometricDataMethod;
    var primaryBiometricDataFormat = req.body.primaryBiometricDataFormat;
    var primaryBiometricDataSource = req.body.primaryBiometricDataSource;
    var secondaryBiometricData = req.body.secondaryBiometricData;
    var secondaryBiometricDataLength = req.body.secondaryBiometricDataLength;
    var secondaryBiometricDataMethod = req.body.secondaryBiometricDataMethod;
    var secondaryBiometricDataFormat = req.body.secondaryBiometricDataFormat;
    var secondaryBiometricDataSource = req.body.secondaryBiometricDataSource;
    var channel = req.body.channel;

    // logging
    var body = {
        rquid: rquid,
        documentId: documentId,
        verificationMethod: verificationMethod,
        primaryBiometricDataMethod: primaryBiometricDataMethod,
        primaryBiometricDataFormat: primaryBiometricDataFormat,
        primaryBiometricDataSource: primaryBiometricDataSource,
        secondaryBiometricDataMethod: secondaryBiometricDataMethod,
        secondaryBiometricDataFormat: secondaryBiometricDataFormat,
        secondaryBiometricDataSource: secondaryBiometricDataSource,
        channel: channel
    };
    logger.debug('Received verification request: ' + JSON.stringify(body));

    // request message validation
    if (util.isUndefineNullBlank(rquid)                        ||
        util.isUndefineNullBlank(documentId)                   ||
        util.isUndefineNullBlank(documentIdType)               ||
        util.isUndefineNullBlank(verificationMethod)           ||
        util.isUndefineNullBlank(primaryBiometricData)         ||
        util.isUndefineNullBlank(primaryBiometricDataLength)   ||
        util.isUndefineNullBlank(primaryBiometricDataFormat)   ||
        util.isUndefineNullBlank(primaryBiometricDataSource)   ||
        util.isUndefineNullBlank(secondaryBiometricData)       ||
        util.isUndefineNullBlank(secondaryBiometricDataLength) ||
        util.isUndefineNullBlank(secondaryBiometricDataMethod) ||
        util.isUndefineNullBlank(secondaryBiometricDataFormat) ||
        util.isUndefineNullBlank(secondaryBiometricDataSource) ||
        util.isUndefineNullBlank(channel)
    ) {
        logger.info('Bad request for rquid: ' + rquid);
        res.statusMessage = "Bad request";
        res.status(400);
        res.send({
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: "Missing input(s)"
        });
        return;
    }
    // TODO: validate uuid
    // TODO: validate photo length
    // TODO: validate image format

    // construct message for sending to BMS server
    bmsXmlTemplate('RequestID').text(rquid);
    bmsXmlTemplate('ImageFormat').eq(0).text(primaryBiometricDataFormat.toUpperCase());
    bmsXmlTemplate('ImageLength').eq(0).text(primaryBiometricDataLength);
    bmsXmlTemplate('ImageData').eq(0).text(primaryBiometricData);
    bmsXmlTemplate('ImageFormat').eq(1).text(secondaryBiometricDataFormat.toUpperCase());
    bmsXmlTemplate('ImageLength').eq(1).text(secondaryBiometricDataLength);
    bmsXmlTemplate('ImageData').eq(1).text(secondaryBiometricData);

    // store biometric data (images)
    // var BiometricData = mongoose.model("BiometricData", biometricDataSchema);
    var currentUnixTime = Date.now(); // Unix timestamp - Important variable !!!
    var currentDate = new Date(currentUnixTime);

    // store primary data
    var primaryPhotoRefId = uuidv4();
    var primaryPhoto = {
        biometricRefId: primaryPhotoRefId,
        documentId: documentId,
        documentIdType: documentIdType,
        biometricData: primaryBiometricData,
        biometricDataFormat: primaryBiometricDataFormat,
        biometricDataMethod: primaryBiometricDataMethod,
        biometricDataSource: primaryBiometricDataSource,
        timestamp: currentUnixTime,
        date: currentDate,
        channel: channel
    };


    // primaryPhoto.save((err) => {
    //     if (err) {
    //         logger.error('Found internal error when saving primary photo for rquid: ' + rquid);
    //         logger.error(err);
    //     } else {
    //         logger.info('Primary photo has been saved for rquid: ' + rquid);
    //     }
    // });

    // store secondary data
    var secondaryPhotoRefId = uuidv4();
    var secondaryPhoto = {
        biometricRefId: secondaryPhotoRefId,
        documentId: documentId,
        documentIdType: documentIdType,
        biometricData: secondaryBiometricData,
        biometricDataFormat: secondaryBiometricDataFormat,
        biometricDataMethod: secondaryBiometricDataMethod,
        biometricDataSource: secondaryBiometricDataSource,
        timestamp: currentUnixTime,
        date: currentDate,
        channel: channel
    };


    // secondaryPhoto.save((err) => {
    //     if (err) {
    //         logger.error('Found internal error when saving secondary photo for rquid: ' + rquid);
    //         logger.error(err);
    //     } else {
    //         logger.info('Secondary photo has been saved for rquid: ' + rquid);
    //     }
    // });

    // for linux rh
    // send post request
    request.post({
        headers: {
            'content-type': contentTypeTextXml
        },
        url: necFaceVerificationUrl,
        body: bmsXmlTemplate.html(),
    }, async (error, response, body) => {
        logger.info('Response from BMS for rquid: ' + rquid + " --> " + body);
        var jsonErr = {}
        var xmlResponse = cheerio.load(body, {
            xmlMode: true
        });
        var jsonErr = {
            rquid: rquid,
            statusCode: errorStatus,
            statusDesc: "Error",
            remark: "Internal server error"

        }
        if (xmlResponse('StatusCode').text() != "000") {
            jsonErr = {
                rquid: rquid,
                statusCode: xmlResponse('StatusCode').eq(1).text(),
                statusDesc: xmlResponse('StatusMsg').eq(1).text(),
                remark: "Internal server error"
            }
        }
        logger.info(error)
        if (error) {
            logger.error('Found internal error when posting message to BMS server for rquid: ' + rquid);
            logger.error(error);
            res.status(500);
            res.json(jsonErr);
        } else {
            try {
                var xmlResponse = cheerio.load(body, {
                    xmlMode: true
                });
                var totalScore = xmlResponse('totalscore').text();

                // process total score
                var numTotalScore = parseInt(totalScore);
                var resultCode;
                var resultDesc;
                var idp;

                if (thaiIdValidator(documentId)) {
                    // if CID
                    logger.info("ID provided for verification is CID, rquid: " + rquid);
                    if (numTotalScore >= 6000) {
                        resultCode = "1";
                        resultDesc = "Pass";
                        idp = "0";
                    } else if (numTotalScore >= 3000 && numTotalScore < 6000) {
                        resultCode = "0";
                        resultDesc = "Pass with condition";
                        idp = "1";
                    } else {
                        resultCode = "-1";
                        resultDesc = "Fail";
                        idp = "0";
                    }
                } else {
                    if (numTotalScore >= 6500) {
                        resultCode = "1";
                        resultDesc = "Pass";
                        idp = "0";
                    } else if (numTotalScore >= 3500 && numTotalScore < 6500) {
                        resultCode = "0";
                        resultDesc = "Pass with condition";
                        idp = "1";
                    } else {
                        resultCode = "-1";
                        resultDesc = "Fail";
                        idp = "0";
                    }
                }

                await db('biometricData')
                    .insert(primaryPhoto)
                    .catch((err) => {
                        logger.error('Found internal error when saving primary photo for rquid: ' + rquid);
                        logger.error(err.toString());
                    }).then(() => {
                        logger.info('Primary photo has been saved for rquid: ' + rquid);
                    });

                await db('biometricData')
                    .insert(secondaryPhoto)
                    .catch((err) => {
                        logger.error('Found internal error when saving secondary photo for rquid: ' + rquid);
                        logger.error(err.toString());

                    }).then(()=>{
                    logger.info('Secondary photo has been saved for rquid: ' + rquid);
                });

                // record 1-to-1 verification
                var verificationRefId = uuidv4();
                var historyData = {
                    verificationRefId: verificationRefId,
                    primaryBiometricDataRefId: primaryPhotoRefId,
                    secondaryBiometricDataRefId: secondaryPhotoRefId,
                    primaryBiometricDataMethod: primaryBiometricDataMethod,
                    secondaryBiometricDataMethod: secondaryBiometricDataMethod,
                    documentId: documentId,
                    documentIdType: documentIdType,
                    verificationMethod: verificationMethod,
                    timestamp: currentUnixTime,
                    date: currentDate,
                    totalScore: numTotalScore,
                    resultCode: resultCode,
                    resultDesc: resultDesc,
                    idp: idp,
                    channel: channel
                };
                await db('verificationHistoryData').insert(historyData)
                    .catch((err) => {
                        logger.error('Found internal error when saving verification data for rquid: ' + rquid);
                        logger.error(err.toString());
                        res.status(500);
                        res.json(jsonErr)
                    })
                    .then(() => {
                        logger.info('1-to-1 Face verification history has been saved for rquid: ' + rquid);
                        // send response back to client
                        var json = {
                            rquid: rquid,
                            statusCode: successStatus,
                            statusDesc: "Success",
                            remark: "Verification successful",
                            verificationRefId: verificationRefId,
                            resultCode: resultCode,
                            resultDesc: resultDesc,
                            score: parseFloat(totalScore).toFixed(2),
                            idp: idp
                        };
                        res.send(json);
                    });
                // historyData.save((err) => {
                //     if (err) {
                //         logger.error('Found internal error when saving verification data for rquid: ' + rquid);
                //         logger.error(err);
                //         res.status(500);
                //         res.json(jsonErr);
                //     } else {
                //         logger.info('1-to-1 Face verification history has been saved for rquid: ' + rquid);
                //         // send response back to client
                //         var json = {
                //             rquid: rquid,
                //             statusCode: successStatus,
                //             status: successStatus,
                //             statusDesc: "Success",
                //             remark: "Verification successful",
                //             verificationRefId: verificationRefId,
                //             resultCode: resultCode,
                //             resultDesc: resultDesc,
                //             score: totalScore,
                //             idp: idp
                //         };
                //         res.send(json);
                //     }
                // });

            } catch (err) {
                logger.error('Found internal error when process a response from BMS server for rquid: ' + rquid);
                logger.error(err);
                res.status(500);
                res.json(jsonErr);
            }
        }
    });
};

thaiIdValidator = (id) =>{
    if(id.length != 13) return false;
    for(i=0, sum=0; i < 12; i++)
    sum += parseFloat(id.charAt(i))*(13-i); if((11-sum%11)%10!=parseFloat(id.charAt(12)))
    return false; return true;
};
