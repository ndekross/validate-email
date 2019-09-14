const fs = require('fs');

fs.readFile('./tlds-alpha-by-domain.txt', 'utf-8', (err, file) =>{
  if (err) console.log(err);
  const domains = file.split('\n')
    .filter(l => /\s/.test(l) === false)
    .map(d => `'${d.toLowerCase()}'`);
  fs.writeFile('./tld.js', 
  `module.exports = [${domains}];`, err => {
    if (err) console.log(err);
    else console.log("Done");
  });
});