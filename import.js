var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/admin');

var schemas = require('./schemas.js')(mongoose);
var db = require('./database/dbconnection').db



importOverwriteData = async function() {
  var OverwriteByData = mongoose.model("OverwriteByData", schemas.overwriteByDataSchema);
  OverwriteByData.find({}, function(err, documents) {
    console.log(documents.length)
    let promiseArr = documents.map(async (document) => {
      let x = JSON.parse(JSON.stringify(document))
      delete x._id
      delete x.__v
      delete x.date
      await db('overwriteByData').insert(x)
        .catch((err) => {
            console.log(err)
        }).then(()=>{
        });
      })
      Promise.all(promiseArr).then(function(resultsArray){
         console.log("import completed")
         process.exit();
      }).catch(function(err){
         // do something when any of the promises in array are rejected
      })
    })
}

importBiometricData = async function() {
  var BiometricData = mongoose.model("BiometricData", schemas.biometricDataSchema);
  BiometricData.find({}, function(err, documents) {
    console.log(documents.length)
    let promiseArr = documents.map(async (document) => {
      let x = JSON.parse(JSON.stringify(document))
      delete x._id
      delete x.__v
      delete x.date
      await db('biometricData').insert(x)
        .catch((err) => {
            console.log(err)
        }).then(()=>{
        });
      })
      Promise.all(promiseArr).then(function(resultsArray){
         console.log("import biometric data completed")
         process.exit();
      }).catch(function(err){
         // do something when any of the promises in array are rejected
      })
    })
}


importVerificationHistoryData = async function() {
  var VerificationHistoryData = mongoose.model("VerificationHistoryData", schemas.verificationHistoryDataSchema);
  VerificationHistoryData.find({}, function(err, documents) {
    console.log(documents.length)
    let promiseArr = documents.map(async (document) => {
      let x = JSON.parse(JSON.stringify(document))
      delete x._id
      delete x.__v
      delete x.date
      await db('verificationHistoryData').insert(x)
        .catch((err) => {
            console.log(err)
        }).then(()=>{
        });
      })
      Promise.all(promiseArr).then(function(resultsArray){
         console.log("import biometric data completed")
         process.exit();
      }).catch(function(err){
         // do something when any of the promises in array are rejected
      })
    })
}
importOverwriteData();
//importBiometricData()
//importVerificationHistoryData();
// var BiometricData = mongoose.model("BiometricData", schemas.biometricDataSchema);
// BiometricData.find({}, function(err, documents) {
//   console.log(documents.length)

//   documents.forEach((document) => {
//     let x = JSON.parse(JSON.stringify(document))
//     delete x._id
//     delete x.__v
//     delete x.date
//     db('biometricData').insert(x)
//         .catch((err) => {
//             console.log(err)
//         }).then(()=>{

//         });
//   })
// });

// var VerificationHistoryData = mongoose.model("VerificationHistoryData", schemas.verificationHistoryDataSchema);
// VerificationHistoryData.find({}, function(err, documents) {
//   console.log(documents.length)

//   documents.forEach((document) => {
//     let x = JSON.parse(JSON.stringify(document))
//     delete x._id
//     delete x.__v
//     delete x.date
//     db('verificationHistoryData').insert(x)
//         .catch((err) => {
//             console.log(err)
//         }).then(()=>{

//         });
//   })
// });




