// Email validation using regex
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone number validation - accepts various formats
const validatePhoneNumber = (phoneNumber) => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if the cleaned number is between 10 and 15 digits
    // This allows for different country codes
    return cleaned.length >= 10 && cleaned.length <= 15;
};

// Clean and format phone number to E.164 format
const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with +, assume it's a local number and add country code
    if (!phoneNumber.startsWith('+')) {
        return `+1${cleaned}`; // Assuming US/Canada numbers by default
    }
    
    return `+${cleaned}`;
};

module.exports = {
    validateEmail,
    validatePhoneNumber,
    formatPhoneNumber
}; 