const dns = require('dns');
const defaultTLDList = require('./tld');

class EmailError extends Error{
  constructor(message){
    super(message);
    this.name = "Invalid Email";
  }
}

// Email pattern from 
// https://emailregex.com
const defaultPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function validatePattern(email, pattern = defaultPattern) {
  return pattern.test(email);
}

function validateTopLevelDomain(domain, tld = defaultTLDList){
  const [, top] = domain.match(/\.(\w+)$/);
  return tld.some(dom => dom === top);
}

function validateMx(domain, timeout = 500, maxAttempts = 2){
  return new Promise((resolve, reject) => {
    let done = false;
    function attempt(n){
      dns.resolveMx(domain, (failed, result) => {
        done = true;
        if (failed) reject(failed);
        else resolve(true);
      });
      setTimeout(() => {
        if (n > maxAttempts) reject(new EmailError("MX check timed out"));
        if (done) return;
        attempt(n + 1);
      }, timeout);
    }
    attempt(0);
  });
}

const defaultOptions = {
  regexp: true,
  tld: true,
  mx: true,
};


function validateEmail(email, options = defaultOptions){
  return new Promise((resolve, reject) => {
    if (options.regexp) {
      if (!validatePattern(email)) 
        return reject(detectProblem(email));
    }
    const [, domain] = email.split('@');
    if (options.tld) {
      if (!validateTopLevelDomain(domain)) 
        return reject(new EmailError("The top level domain doesn't exist"));
    }
    if (options.mx){
      try {
        if (!validateMx(domain)) 
          return reject(new EmailError("No MX records detected for the hostname"));
      } catch (error) {
        if (error.code === "ENOTFOUND") 
          return  reject("The hostname doesn't exist");
        else return error;
      }
    }
    return resolve(true);
  });
}

function detectProblem(input){
      const ats = input.match(/@/g);
     
      if (ats == null || ats.length < 1) 
      throw new EmailError("Missing @ sign");
        
      if (ats.length > 1) 
      throw new EmailError("More than one @ signs");

      const [local, domain] = input.split('@');

      if (/^\.+/.test(input))
      throw new EmailError("Leading dot in address is not allowed");

      if (/\.\.+/.test(input)) 
      throw new EmailError("Multiple dots are not allowed");

      if (/((\w+)*\s*)+<\w+@\w+\.\w+>/.test(input)) 
      throw new EmailError("Encoded html within email is invalid");

      if (/^\-+/.test(domain))
      throw new EmailError("Leading dash in front of domain is invalid");
      
      if (/(\w+@\w+\.\w+)\s*\w*/.test(input))
      throw new EmailError("Text followed email is not allowed");
      
      if (!/\.\w+$/.test(input))
      throw new EmailError("Missing top level domain (.com/.net/.org/etc)");

      if (local.length === 0) 
      throw new EmailError("Missing username");

      if (/^\.+/.test(local)) 
      throw new EmailError("Leading dot in address is not allowed");

      if (/\.+$/.test(local))
      throw new EmailError("Trailing dot in address is not allowed");

      else
      throw new EmailError("The provided email address is not valid");
}

module.exports = validateEmail;