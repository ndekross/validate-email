const dns = require('dns');
const defaultTLDList = require('./constants/tld');
const defaultPattern = require('./constants/pattern');

const defaultOptions = {
  regexp: true,
  tld: true,
  mx: true,
};

function validatePattern(email, pattern = defaultPattern) {
  return pattern.test(email);
}

function validateTopLevelDomain(top, tld = defaultTLDList){
  return tld.some(dom => dom === top);
}

function validateMx(domain, timeout = 250, maxAttempts = 2){
  return new Promise((resolve, reject) => {
    let done = false;
    function attempt(n){
      dns.resolveMx(domain, (failed, ) => {
        done = true;
        if (failed) reject(failed);
        return resolve(true);
      });
      setTimeout(() => {
        if (n > maxAttempts) reject(new Error("MX check timed out"));
        if (done) return;
        attempt(n + 1);
      }, timeout);
    }
    attempt(0);
  });
}


function validateEmail(email, options = defaultOptions){
  return new Promise((resolve, reject) => {
    if (options.regexp) {
      if (!validatePattern(email)) 
        return reject(detectProblem(email));
    }
    const [, domain] = email.split('@');
    if (options.tld) {
      const [, top] = domain.match(/\.(\w+)$/);
      if (!validateTopLevelDomain(top))
        return reject(new Error(`The top level domain ${'.'+top.toUpperCase()} doesn't exist`));
    }
    if (options.mx){
      validateMx(domain)
        .then(res => resolve(res))
        .catch(err => {
          if (err.code === "ENOTFOUND") 
            reject(new Error(`The domain ${domain} doesn't exist`));
          if (err.code === "ENODATA")
            reject(new Error(`No MX records for the domain ${domain}`));
          reject(err);
        });
    }
  });
}

function detectProblem(input){
      const ats = input.match(/@/g);
     
      if (ats == null || ats.length < 1) 
      throw new Error("Missing @ sign");
        
      if (ats.length > 1) 
      throw new Error("More than one @ signs");

      const [local, domain] = input.split('@');

      if (/^\.+/.test(input))
      throw new Error("Leading dot in address is not allowed");

      if (/\.\.+/.test(input)) 
      throw new Error("Multiple dots are not allowed");

      if (/((\w+)*\s*)+<\w+@\w+\.\w+>/.test(input)) 
      throw new Error("Encoded html within email is invalid");
      
      if (/(\w+@\w+\.\w+)\s+\w*/.test(input))
      throw new Error("Text followed email is not allowed");
      
      if (!/\.\w+$/.test(input))
      throw new Error("Missing top level domain (.com/.net/.org/etc)");

      if (local.length === 0) 
      throw new Error("Missing username");

      if (/\.+$/.test(local))
      throw new Error("Trailing dot in address is not allowed");

      throw new Error("The provided email address is not valid");
}

module.exports = validateEmail;