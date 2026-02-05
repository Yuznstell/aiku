/**
 * Standard API response helper
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const created = (res, data = null, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
    return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized') => {
    return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
    return error(res, message, 403);
};

const paginated = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination,
    });
};

module.exports = {
    success,
    created,
    error,
    notFound,
    badRequest,
    unauthorized,
    forbidden,
    paginated,
};
