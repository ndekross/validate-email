const test = require('ava');
const validateEmail = require('../index');
const fs = require('fs');

function readEmailsFrom(list) {
  return new Promise((resolve, reject) => {
    let emails = [];
    fs.readFile(__dirname + `/${list}.txt`, 'utf-8', (err, file) => {
      if (err) return reject(err);
      emails = file.split('\n');
      return resolve(emails);
    });
  });
}

readEmailsFrom('test-cases').then(testCases => {
  testCases.map(tc => tc.split('*')).forEach(([email, result]) => {
    test(`validateEmail('${email}') —> ${result}`, t => {
      return validateEmail(email)
        .then(validity => t.true(validity))
        .catch(error => t.assert(error.message === result));
    });
  });
});


