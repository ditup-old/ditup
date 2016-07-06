'use strict';

var co = require('co');
module.exports = function (parameters) {
  let db = parameters.db;
  let dbUser = parameters.dbUser;
  let dbPasswd = parameters.dbPasswd;
  let dbName = parameters.dbName;
  let collections = parameters.collections;

  return co(function *() {
    //dropping database if exist
    try {
      yield db.dropDatabase(dbName);
    }
    catch (err) {
      console.log('creating new database');
    }
    //(re)creating the database
    yield db.createDatabase(dbName, [{username: dbUser, passwd: dbPasswd}]);
    
    db.useDatabase(dbName);

    for(let cnm in collections) {
      //creating the collection
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
      yield col.create();
      //creating indexes
      //
      //unique hash index
      for(let indexName of collections[cnm].unique){
        yield col.createHashIndex(indexName, {unique: true});
      }
      //not unique hash index
      collections[cnm].hash = collections[cnm].hash || [];
      for(let indexName of collections[cnm].hash){
        yield col.createHashIndex(indexName, {unique: false});
      }
    }
  });
};
