const crypto = require('crypto');

/**
 * Generates a random access code
 * @returns {string} A random 8-character access code
 */
const generateRandomCode = () => {
    // Generate a random 8-character code using crypto
    // Format: XXXX-XXXX where X is a hex digit
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${part1}-${part2}`;
};

module.exports = {
    generateRandomCode
}; 