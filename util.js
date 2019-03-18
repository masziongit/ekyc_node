
exports.dateNow = () => {
        return (new Date()).toLocaleString();
};

exports.isUndefineNullBlank = (field) => {
   return (field === undefined || field === null || field === '') ? true : false
}


exports.signature = (timestamp,none)=>{

    let skey = process.env.SIGNATURE
    let message = encodeURIComponent(timestamp.concat(none), "UTF-8");
    let crypto = require('crypto')
        , text = message
        , key = skey
        , hash

    hash = crypto.createHmac('sha1', key).update(text).digest('hex')
    return hash.toUpperCase()
}

