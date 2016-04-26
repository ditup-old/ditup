require('express');

module.exports = function (req, res, next) {
  try {
    return next();
  }
  catch(err) {return next(err);}
};
