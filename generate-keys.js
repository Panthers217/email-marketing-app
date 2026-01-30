#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n=== Email Marketing App - Key Generator ===\n');
console.log('Copy these values to your server/.env file:\n');
console.log('APP_SECRET_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('\nIMPORTANT: Keep these keys secure and never commit them to version control!\n');
