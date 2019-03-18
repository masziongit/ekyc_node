// MongoDB schemas
var Schema;

module.exports = (mongoose) => {
    Schema = mongoose.Schema;

    var biometricDataSchema = new Schema({
        biometricRefId: String,
        documentId: String,
        documentIdType: String,
        biometricData: String,
        biometricDataType: String,
        biometricDataFormat: String,
        biometricDataMethod: String,
        biometricDataSource: String,
        timestamp: String,
        date: Date, // <------------
        channel: String
    });

    var verificationHistoryDataSchema = new Schema({
        verificationRefId: String,
        primaryBiometricDataRefId: String,
        secondaryBiometricDataRefId: String,
        primaryBiometricDataMethod: String,
        secondaryBiometricDataMethod: String,
        documentId: String,
        documentIdType: String,
        verificationMethod: String,
        timestamp: String,
        date: Date, // <------------
        totalScore: Number, // <------------
        resultCode: String,
        resultDesc: String,
        idp: String,
        channel: String
    });

    var overwriteByDataSchema = new Schema({
        overwriteByRefId: String,
        verificationRefId: String,
        matchResult: String, // Y or N
        remark: String,
        timestamp: String,
        date: Date, // <------------
        overwriteByStaffId: String, // AD
        overwriteByStaffName: String, // AD
        channel: String, // branch
        branchCode: String
    });
        
    return {
        biometricDataSchema: biometricDataSchema,
        verificationHistoryDataSchema: verificationHistoryDataSchema,
        overwriteByDataSchema: overwriteByDataSchema
    };
};
