'use strict';

module.exports = function (config) {
  return `http://${config.username}:${config.password}@${config.host}:${config.port}`;
}
