'use strict';

var arangojs = require('arangojs');
var config = require('../services/db-config');

var db = new arangojs.Database({url: config.url});
//var db2 = new arangojs.Database({url: config.url});
var aql = arangojs.aqlQuery(['RETURN ', ''], Date.now());
var query = aql.query;
var bindVars = aql.bindVars;

var collections = require('../services/data/collections');

/*var arangojs = require('arangojs');
var db = arangojs({url: config.url});
*/
var dbName = config.dbname;

return db.dropDatabase(dbName)
  .catch(function (err) {
    console.log('creating new database');
  })
  .then(function () {
    return db.createDatabase(dbName);
  })
  .then(function () {
    db.useDatabase(dbName);
    let cols = [];
    for(let cnm in collections) {
      let col;
      if(collections[cnm].type === 'document') {
        col = db.collection(cnm);
      }
      else if(collections[cnm].type === 'edge') {
        col = db.edgeCollection(cnm);
      }
      else{
        throw new Error('not document nor edge');
      }
      cols.push(col.create()
        .then(function () {
          let cin = [];

          for(let indexName of collections[cnm].unique){
            cin.push(col.createHashIndex(indexName, {unique: true}));
          }

          return Promise.all(cin);
        }));
    }
    return Promise.all(cols);
  })
  .then(null, function (err) {
    console.log(err);
  });
