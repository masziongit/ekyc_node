var Prompt = require('prompt-password');
var crypto = require('crypto'),
    algorithm = 'aes-256-cbc',
    password = 'jwJ3j6bvHEtRrHUpbtf1';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

var prompt = new Prompt({
  type: 'password',
  message: 'Enter your password please',
  name: 'password'
});

prompt.run()
  .then(function(answers) {
    console.log(encrypt(answers))
});
