const test = require('ava');
const validateEmail = require('../index');
const fs = require('fs').promises;

(async () => {
  let testCases = await fs.readFile(__dirname + `/test-cases.txt`, 'utf-8');
  testCases
    .split('\n')
    .filter(tc => tc[0] !== '#')
    .map(tc => tc.split('*'))
    .forEach(([email, result]) => {
      test(`validateEmail('${email}') —> ${result}`, async t => {
        try {
          if (result === "true") result = true;
          return t.assert(await validateEmail(email) === result);
        }
        catch (error) {
          return t.assert(error.message === result);
        }
      });
    });
})();