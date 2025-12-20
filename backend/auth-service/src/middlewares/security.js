/**
 * Custom MongoDB Sanitization Middleware
 * Recursively removes keys starting with '$' or containing '.'
 * Modifies objects IN-PLACE to avoid "Getter" errors.
 */
export const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (let key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]; // Delete the dangerous key
      } else {
        sanitize(obj[key]); // Recursively clean nested objects
      }
    }
  };

  // Sanitize specific parts of the request
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};