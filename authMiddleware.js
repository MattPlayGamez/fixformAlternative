/**
 * Middleware function to check authentication status of a request.
 * 
 * This function checks if the request has a valid JWT token in the
 * Authorization header. If the token is missing or invalid, it returns
 * a 401 Unauthorized response. If the token is valid, it calls the
 * next middleware function.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */

const jwt = require('jsonwebtoken')


function checkAuthStatus(req, res, next) {
    // const authToken = req.header('authorization');
    const authToken = req.cookies.token
    
    console.log(authToken)

    if (authToken) {

        jwt.verify(authToken, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.redirect(403, '/login'); // Forbidden if the token is invalid
            }

            console.log(user)
            next(); // Pass control to the next middleware/route handler
        });
    } else {
        res.redirect(401, '/login'); // Unauthorized if no token is provided
    }

}

// Export the checkAuthStatus function
module.exports = checkAuthStatus;