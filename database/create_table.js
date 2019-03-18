var db = require('./dbconnection').db

var biometricData = db.schema.createTable('biometricData', function (table) {
    table.uuid('biometricRefId').notNullable().primary();
    table.string('documentId');
    table.string('documentIdType');
    table.text('biometricData');
    table.string('biometricDataFormat');
    table.string('biometricDataMethod');
    table.string('biometricDataSource');
    table.integer('timestamp');
    table.date('date');
    table.string('channel');
})

var overwriteByData = db.schema.createTable('overwriteByData', function (table) {
    table.uuid('overwriteByRefId').notNullable().primary();
    table.string('verificationRefId');
    table.string('matchResult');
    table.string('remark');
    table.integer('timestamp');
    table.datetime('date');
    table.string('overwriteByStaffId');
    table.string('overwriteByStaffName');
    table.string('channel');
    table.string('branchCode');
})
var verificationHistoryData = db.schema.createTable('verificationHistoryData', function (table) {
    table.uuid('verificationRefId').notNullable().primary();
    table.string('primaryBiometricDataRefId');
    table.string('secondaryBiometricDataRefId');
    table.string('primaryBiometricDataMethod');
    table.string('secondaryBiometricDataMethod');
    table.string('documentId');
    table.string('documentIdType');
    table.string('verificationMethod');
    table.integer('timestamp');
    table.date('date');
    table.integer('totalScore');
    table.string('resultCode');
    table.string('resultDesc');
    table.string('idp');
    table.string('channel');
})

var create = async()=>{
    console.log(biometricData.toString())
    await biometricData.then(()=>{
        console.log('biometricData Table is Created!')
    }).catch((e)=>{
        console.error(e)
    })
    console.log(overwriteByData.toString())
    await  overwriteByData.then(()=>{
        console.log('overwriteByData Table is Created!')
    }).catch((e)=>{
        console.error(e)
    })

    console.log(verificationHistoryData.toString())
    await verificationHistoryData.then(()=>{
        console.log('verificationHistoryData Table is Created!')
    }).catch((e)=>{
        console.error(e)
    })

    process.exit()
}

create()



