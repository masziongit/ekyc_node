// Overwrite Service: For overwrite matching result by supervisor at branch

const request = require('request');
const util = require('./util.js');
const cheerio = require('cheerio');

const contentTypeTextXml = 'text/xml';
// const necFaceVerificationUrl = 'http://192.168.99.100:3000/passport/verification';
const necFaceVerificationUrl = process.env.PASSPORT_VERIFICATION_HOST;
const errorStatus = '1999';

module.exports =  (json) => {

    var req = json.req;
    var res = json.res;
    var logger = json.logger;

    var rquid = req.body.rquid;

    logger.debug('Received passport verification request: ' + JSON.stringify(res.body));

    var ldsXmlTemplate =
        `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mrtd="http://mrtd.nec.com">
            <soapenv:Header/>  
            <soapenv:Body>     
                <mrtd:verify>        
                    <mrtd:passportData>           
                        <mrtd:dg1Data>${req.body.dg1Data}</mrtd:dg1Data>
                        <mrtd:dg2Data>${req.body.dg2Data}</mrtd:dg2Data>                       
                        <mrtd:sodData>${req.body.sodData}</mrtd:sodData>        
                    </mrtd:passportData>     
                </mrtd:verify>  
            </soapenv:Body>
        </soapenv:Envelope>`

    request.post({
        headers: {
            'content-type': contentTypeTextXml,
            'SOAPAction': "/services/PassportVerifyService?wsdl"
        },
        url: necFaceVerificationUrl,
        body: ldsXmlTemplate,
    },(error, response, body) => {
        logger.info('Response from LDS for rquid: ' + rquid + " --> " + body);
        if (error){
            logger.error('Found internal error when posting message to LDS server for rquid: ' + rquid);
            logger.error(error);
            res.status(500);
            res.json({
                rquid: rquid,
                statusCode: errorStatus,
                statusDesc: "Error",
                remark: "Internal server error"
            });
        }else {
            try{
                var xmlResponse = cheerio.load(body, {
                    xmlMode: true
                });
                res.json({
                    rquid: rquid,
                    citizenId: xmlResponse('citizenId').text(),
                    expirationDate: xmlResponse('expirationDate').text(),
                    nameInThai: xmlResponse('nameInThai').text(),
                    passportNumber: xmlResponse('passportNumber').text(),
                    photo: xmlResponse('photo').text(),
                    primaryIdentifier: xmlResponse('primaryIdentifier').text(),
                    secondaryIdentifier: xmlResponse('secondaryIdentifier').text(),
                    resultCode: xmlResponse('resultCode').text()
                });

            }catch (err) {
                console.log(err)
                logger.error('Found internal error when process a response from LDS server for rquid: ' + rquid);
                logger.error(err);
                res.status(500);
                res.json({
                    rquid: rquid,
                    statusCode: errorStatus,
                    statusDesc: "Error",
                    remark: "Internal server error"
                });
            }
        }
    });
};
