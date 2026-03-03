// Format amount to Korean currency
const formatAmount = (amount) => {
  if (amount >= 100000000) {
    return (amount / 100000000).toLocaleString() + ' 억원';
  }
  return amount.toLocaleString() + ' 원';
};

// Paginate array
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      itemsPerPage: limit
    }
  };
};

// Create error with status code
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  formatAmount,
  paginate,
  createError
};
