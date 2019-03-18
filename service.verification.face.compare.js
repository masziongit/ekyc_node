// 1-to-1 Face Verification Service

// import dependencies
const util = require('./util.js');
const successStatus = '1000';
const errorStatus = '1999';
const uuidv4 = require('uuid/v4');

const faceVerificationUrl = process.env.FACE_COMPARE;

module.exports = (json) => {

    let logger = json.logger;
    let req = json.req;
    let res = json.res;
    let db = json.db;



    logger.debug('Received verification request: ' + JSON.stringify(req.body));

    let rquid = req.body.rquid

    if (util.isUndefineNullBlank(rquid)                        ||
        util.isUndefineNullBlank(req.body.documentId)                   ||
        util.isUndefineNullBlank(req.body.documentIdType)               ||
        util.isUndefineNullBlank(req.body.verificationMethod)           ||
        util.isUndefineNullBlank(req.body.primaryBiometricData)         ||
        util.isUndefineNullBlank(req.body.primaryBiometricDataLength)   ||
        util.isUndefineNullBlank(req.body.primaryBiometricDataFormat)   ||
        util.isUndefineNullBlank(req.body.primaryBiometricDataSource)   ||
        util.isUndefineNullBlank(req.body.secondaryBiometricData)       ||
        util.isUndefineNullBlank(req.body.secondaryBiometricDataLength) ||
        util.isUndefineNullBlank(req.body.secondaryBiometricDataMethod) ||
        util.isUndefineNullBlank(req.body.secondaryBiometricDataFormat) ||
        util.isUndefineNullBlank(req.body.secondaryBiometricDataSource) ||
        util.isUndefineNullBlank(req.body.channel)
    ) {

        badRequest(logger,rquid,res)
        return;
    }

    let currentUnixTime = Date.now(); // Unix timestamp - Important variable !!!
    let currentDate = new Date(currentUnixTime);

    // store primary data
    let primaryPhotoRefId = uuidv4();
    let primaryPhoto = {
        biometricRefId: primaryPhotoRefId,
        documentId: req.body.documentId,
        documentIdType: req.body.documentIdType,
        biometricData: req.body.primaryBiometricData,
        biometricDataFormat: req.body.primaryBiometricDataFormat,
        biometricDataMethod: req.body.primaryBiometricDataMethod,
        biometricDataSource: req.body.primaryBiometricDataSource,
        timestamp: currentUnixTime,
        date: currentDate,
        channel: req.body.channel
    };

    // store secondary data
    let secondaryPhotoRefId = uuidv4();
    let secondaryPhoto = {
        biometricRefId: secondaryPhotoRefId,
        documentId: req.body.documentId,
        documentIdType: req.body.documentIdType,
        biometricData:req.body.secondaryBiometricData,
        biometricDataFormat: req.body.secondaryBiometricDataFormat,
        biometricDataMethod: req.body.secondaryBiometricDataMethod,
        biometricDataSource: req.body.secondaryBiometricDataSource,
        timestamp: currentUnixTime,
        date: currentDate,
        channel: req.body.channel
    };

    const jsonErr = {
        rquid: req.body.rquid,
        statusCode: errorStatus,
        statusDesc: "Error",
        remark: "Internal server error"
    }

     verification(req,logger).then(async body => {

         let resultCode
         let numTotalScore = (body.similarity*100).toFixed(2)
         let resultDesc
         let idp

         if(thaiIdValidator(req.body.documentId)){
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
         }else{
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

         // record 1-to-1 verification
         let verificationRefId = uuidv4();
         let historyData = {
             verificationRefId: verificationRefId,
             primaryBiometricDataRefId: primaryPhoto.biometricRefId,
             secondaryBiometricDataRefId: secondaryPhoto.biometricRefId,
             primaryBiometricDataMethod: req.body.primaryBiometricDataMethod,
             secondaryBiometricDataMethod: req.body.secondaryBiometricDataMethod,
             documentId: req.body.documentId,
             documentIdType: req.body.documentIdType,
             verificationMethod: req.body.verificationMethod,
             timestamp: currentUnixTime,
             date: currentDate,
             totalScore: numTotalScore,
             resultCode: resultCode,
             resultDesc: resultDesc,
             idp: idp,
             channel: req.body.channel
         }

         await db('biometricData')
             .insert(primaryPhoto)
             .catch((err) => {
                 logger.error('Found internal error when saving primary photo for rquid: ' + rquid);
                 logger.error(err.toString());
                 throw err
             }).then(() => {
                 logger.info('Primary photo has been saved for rquid: ' + rquid);
             })

         await  db('biometricData')
             .insert(secondaryPhoto)
             .catch((err) => {
                 logger.error('Found internal error when saving secondary photo for rquid: ' + rquid);
                 logger.error(err.toString());
                 throw err
             }).then(()=>{
             logger.info('Secondary photo has been saved for rquid: ' + rquid);
         });

         await db('verificationHistoryData').insert(historyData).returning('*')
             .catch((err) => {
                 logger.error('Found internal error when saving verification data for rquid: ' + rquid);
                 logger.error(err);
                 res.status(500);
                 res.json(jsonErr)
             })
             .then((rs) => {
                 logger.info('1-to-1 Face verification history has been saved for rquid: ' + rquid);
                 // send response back to client
                 var json = {
                     rquid: rquid,
                     statusCode: successStatus,
                     statusDesc: "Success",
                     remark: "Verification successful",
                     verificationRefId: rs[0].verificationRefId,
                     resultCode: rs[0].resultCode,
                     resultDesc: rs[0].resultDesc,
                     score: rs[0].totalScore,
                     idp: rs[0].idp
                 };
                 res.send(json);
             });

     }).catch(error=>{
         logger.error('Received verification request: ' + JSON.stringify(jsonErr));
         res.status(500).json(jsonErr)
         throw error
     })

}

const badRequest = (logger,rquid,res)=>{
    logger.info('Bad request for rquid: ' + rquid);
    res.statusMessage = "Bad request";
    res.status(400);
    res.send({
        statusCode: errorStatus,
        statusDesc: "Error",
        remark: "Missing input(s)"
    });
}



const verification = (req,logger)=>{

    let rp = require('request-promise');

    let phexData = Buffer.from(req.body.primaryBiometricData, 'utf8').toString('hex').toUpperCase();
    let shexData = Buffer.from(req.body.secondaryBiometricData, 'utf8').toString('hex').toUpperCase();

    const timestamp = new Date().getTime()
    const none  =  Math.floor(Math.random() * 9999999) ;
    const sign = util.signature(timestamp+'',none+'')

    let option = {
        method: 'POST',
        uri: faceVerificationUrl,
        headers: {
            "Content-Type":"application/json",
            "x-bi-boundid": "com.paic.xface-test",
            "x-bi-timestamp":timestamp+"",
            "x-bi-none":none+"",
            "Authorization" : sign
        },
        body : {
            image1: {
                "content_type" : req.body.primaryBiometricDataFormat.toLowerCase(),
                data: phexData
            },
            image2: {
                "content_type" : req.body.secondaryBiometricDataFormat.toLowerCase(),
                data: shexData
            }
        },
        json : true
    }

    return new Promise((resolve,reject) => {
        logger.debug('Request to External server : '+JSON.stringify(option))
        rp(option)
            .then(function (body) {
                logger.debug(' Response form External server : '+JSON.stringify(body))
                resolve(body)
            })
            .catch(function (err) {
                logger.error('Found internal error when posting message to External server for rquid: ' + req.body.rquid);
                logger.error(err)
                reject(jsonErr)
                throw err
            });

    })
}

thaiIdValidator = (id) =>{
    if(id.length != 13) return false;
    for(i=0, sum=0; i < 12; i++)
        sum += parseFloat(id.charAt(i))*(13-i); if((11-sum%11)%10!=parseFloat(id.charAt(12)))
        return false; return true;
};
