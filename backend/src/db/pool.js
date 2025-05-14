const supabase = require('../config/supabase');

// Helper function to convert Supabase response to pg-like response
const convertToPgResponse = (result) => {
  return {
    rows: result.data || [],
    rowCount: result.data ? result.data.length : 0
  };
};

// Wrapper to make Supabase queries look like pg queries
const query = async (text, params = []) => {
  try {
    // Convert numbered parameters ($1, $2) to named parameters
    let namedQuery = text;
    const paramMap = {};
    
    params.forEach((param, index) => {
      const paramName = `p${index + 1}`;
      namedQuery = namedQuery.replace(`$${index + 1}`, `:${paramName}`);
      paramMap[paramName] = param;
    });

    // Execute query using Supabase
    const result = await supabase.rpc('execute_sql', {
      query_text: namedQuery,
      query_params: paramMap
    });

    return convertToPgResponse(result);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool: { query } // For backwards compatibility
}; 