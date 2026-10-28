class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function notFound(req, res) {
  res.status(404).json({ error: 'not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'order_ref already exists' });
  }
  console.error(err);
  return res.status(500).json({ error: 'internal error' });
}

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
