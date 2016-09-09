'use strict';

var arangojs = require('arangojs');
var config = require('../services/db-config');
var collections = require('../services/data/collections');
var init = require('../services/data/initDB');
var prompt = require('prompt');

var schema = {
  properties: {
    username: {
      required: true
    },
    password: {
      hidden: true,
      required: true
    }
  }
};

prompt.start();
prompt.get(schema, function (err, result) {
  let rootUser = result.username;
  let rootPasswd = encodeURIComponent(result.password);


  var db = arangojs({url: `http://${rootUser}:${rootPasswd}@${config.host}:${config.port}`});

  return init({
    db: db,
    dbName: config.database,
    dbPasswd: config.password,
    dbUser: config.username,
    collections: collections
  })
    .catch((err) => console.error(err));
});




/*



  */
