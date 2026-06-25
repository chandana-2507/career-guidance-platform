export const notFound = (req, res, next) => {

  const error = new Error(`Not Found - ${req.originalUrl}`);

  res.status(404);

  next(error);

};



export const errorHandler = (err, req, res, next) => {

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;



  let message = err.message || 'Server Error';

  if (req.originalUrl?.startsWith('/api/ai') && !err.expose) {

    if (err.isAiError && err.userMessage) {

      message = err.userMessage;

    } else if (typeof message === 'string' && message.trim().startsWith('{')) {

      message = 'CareerPilot AI is temporarily unavailable. Please try again shortly.';

    }

  }



  res.status(statusCode).json({

    success: false,

    message,

    ...(process.env.NODE_ENV === 'development' &&

      !req.originalUrl?.startsWith('/api/ai') && { stack: err.stack }),

  });

};

