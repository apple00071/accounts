const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const { generateRandomCode } = require('../utils/codeGenerator');

/**
 * Creates a new access code
 * @param {string} adminId - The ID of the admin creating the code
 * @param {string} businessName - The name of the business the code is for
 * @param {Date} expiresAt - The expiration date of the code
 * @returns {Promise<Object>} The created access code
 */
const createAccessCode = async (adminId, businessName, expiresAt) => {
    const code = generateRandomCode();
    
    const { data, error } = await supabase
        .from('access_codes')
        .insert([
            {
                id: uuidv4(),
                code,
                business_name: businessName,
                created_by: adminId,
                status: 'active',
                expires_at: expiresAt.toISOString()
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating access code:', error);
        throw new Error('Failed to create access code');
    }

    return data;
};

/**
 * Validates and uses an access code
 * @param {string} code - The access code to validate
 * @param {string} businessId - The ID of the business using the code
 * @returns {Promise<Object>} The validated and used access code
 */
const validateAndUseAccessCode = async (code, businessId) => {
    // First, check if the code exists and is available
    const { data: accessCode, error: fetchError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .eq('status', 'active')
        .single();

    if (fetchError || !accessCode) {
        throw new Error('Invalid or already used access code');
    }

    // Check if the code has expired
    if (new Date(accessCode.expires_at) < new Date()) {
        throw new Error('Access code has expired');
    }

    // Update the access code status and link it to the business
    const { data: updatedCode, error: updateError } = await supabase
        .from('access_codes')
        .update({
            status: 'used',
            used_by: businessId,
            used_at: new Date().toISOString()
        })
        .eq('id', accessCode.id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating access code:', updateError);
        throw new Error('Failed to use access code');
    }

    return updatedCode;
};

/**
 * Lists all access codes
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} Array of access codes
 */
const listAccessCodes = async (filters = {}) => {
    let query = supabase
        .from('access_codes')
        .select(`
            id,
            code,
            business_name,
            status,
            created_at,
            expires_at,
            used_at,
            used_by:businesses (
                id,
                name,
                email
            )
        `);

    // Apply filters if provided
    if (filters.status) {
        query = query.eq('status', filters.status.toLowerCase());
    }
    if (filters.businessId) {
        query = query.eq('used_by', filters.businessId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error listing access codes:', error);
        throw new Error('Failed to list access codes');
    }

    return data;
};

/**
 * Revokes an access code
 * @param {string} codeId - The ID of the access code to revoke
 * @returns {Promise<Object>} The revoked access code
 */
const revokeAccessCode = async (codeId) => {
    const { data, error } = await supabase
        .from('access_codes')
        .update({
            status: 'expired',
            revoked_at: new Date().toISOString()
        })
        .eq('id', codeId)
        .select()
        .single();

    if (error) {
        console.error('Error revoking access code:', error);
        throw new Error('Failed to revoke access code');
    }

    return data;
};

module.exports = {
    createAccessCode,
    validateAndUseAccessCode,
    listAccessCodes,
    revokeAccessCode
}; 