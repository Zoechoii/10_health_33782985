const bcrypt = require('bcrypt');
const crypto = require('crypto');

// generate salt
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// hash password
async function hashPassword(password, salt) {
    const hash = await bcrypt.hash(password + salt, 10);
    return hash;
}

// verify password
async function verifyPassword(password, hash, salt) {
    const result = await bcrypt.compare(password + salt, hash);
    return result;
}

module.exports = {
    generateSalt,
    hashPassword,
    verifyPassword
};

