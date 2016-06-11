'use strict';

module.exports = function (db) {
  var data = {};
  var modules = ['user', 'tag', 'discussion', 'challenge', 'idea', 'project'];


  for (let md of modules) {
    data[md] = require('../services/data/'+md)(db);
  }

  
  var dependencies = (function () {
    var validate = require('../services/validation');
    var database = require('../services/independentData')({db: db});
    var accountService = require('../services/account');
    var accountConfig = require('../config/user/account.json');

    var independentAccount = require('../modules/independentAccount');

    var dependencies = {
      validate: validate,
      database: database,
      accountService: accountService,
      accountConfig: accountConfig
    };

    return dependencies;
  })();

  data.createUser = require('../modules/independentAccount')(dependencies).createUser;

  /**
   * 
   *
   */
  function populate(dbData) {
    //put dbData to database
    //create users
    function populateUsers(users) {
      var userPromises = [];
      
      for(let i = 0, len = users.length; i<len; ++i) {
        var userData = {
          username: users[i].username,
          password: users[i].password,
          password2: users[i].password,
          email: users[i].email
        };
        var cu = data.createUser(userData)
          .then(function () {
            return data.user.updateEmailVerified({username: userData.username}, {verifyDate: Date.now(), verified: true})
          });
        userPromises.push(cu);
      }

      return Promise.all(userPromises)
        .then(function () {});
    }

    function populateTags(tags, users) {
      var tagPromises = [];
      for(let i = 0, len = tags.length; i < len; ++i) {
        let creator = typeof(tags[i].creator) === 'number' ? users[tags[i].creator].username : tags[i].creator;
        tags[i].creator = creator;
        let tp = data.tag.create({
          name: tags[i].name,
          description: tags[i].description,
          meta: {
            created: Date.now(),
            creator: creator
          }
        });
        tagPromises.push(tp);
      }
      return Promise.all(tagPromises)
        .then(function () {});
    }

    function populateCollections(collections, users, collectionName) {
      var challenges = collections;
      var challengePromises = [];
      for(let i = 0, len = challenges.length; i < len; ++i) {
        let creator = typeof(challenges[i].creator) === 'number' ? users[challenges[i].creator].username : challenges[i].creator;
        challenges[i].creator = creator;
        let cp = data[collectionName].create({
          name: challenges[i].name,
          description: challenges[i].description,
          topic: challenges[i].topic,
          join: collections[i].join,
          join_info: collections[i].join_info,
          creator: creator
        });
        challengePromises.push(cp);
      }
      return Promise.all(challengePromises)
        .then(function (_ids) {
          //copying the ids of the newly saved challenges into the original challenge object (for further use)
          
          for(let i=0, len = _ids.length; i<len; ++i) {
            challenges[i].id = _ids[i].id;
            challenges[i].tags = challenges[i].tags || [];
          }
          return;
        });
    }

    function populateUserTag(userTag, users, tags) {
      var users;
      var utPromises = [];
      //resetting the tags in data object to empty
      for(let u of users){
        u.tags = [];
      }
      for(let _ut of userTag) {
        let user = users[_ut.user];
        let tag = typeof(_ut.tag) === 'number' ? tags[_ut.tag] : {name: _ut.tag};
        let utp = data.user.addTag(user, tag);
        utPromises.push(utp);
      }
      return Promise.all(utPromises)
        .then(function () {
          for(let _ut of userTag) {
            let tagsArray = users[_ut.user].tags;
            let tag = typeof(_ut.tag) === 'number' ? tags[_ut.tag].name : _ut.tag;
            tagsArray.push(tag);
          }
          return;
        });
    }

    function populateCollectionTag(collectionTag, collections, tags, users, collectionName) {
      var challengeTag = collectionTag;
      var challenges = collections;
      var ctPromises = [];
      for(let c of collections){
        c.tags = [];
      }
      for(let _ct of challengeTag) {
        let creator = typeof(_ct.creator) === 'number' ? users[_ct.creator].username : _ct.creator;
        let challenge = challenges[_ct[collectionName]].id;
        let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
        let ctp = data[collectionName].addTag(challenge, tag, creator);
        ctPromises.push(ctp);
      }
      return Promise.all(ctPromises)
        .then(function () {
          for(let _ct of challengeTag) {
            let tagsArray = challenges[_ct[collectionName]].tags = challenges[_ct[collectionName]].tags || [];
            let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
            tagsArray.push(tag);
          }
          return;
        });
    
    }

    function populateCollectionCommentAuthor(collectionCommentAuthor, collections, users, collectionName) {
      var challengeCommentAuthor = collectionCommentAuthor;
      var challenges = collections;
      var ccaPromises = [];
      for(let c of collections) {
        c.comments = [];
      }
      for(let _cca of challengeCommentAuthor) {
        let author = typeof(_cca.author) === 'number' ? users[_cca.author].username : _cca.author;
        let challenge = challenges[_cca[collectionName]];
        let ccap = data[collectionName].addComment(challenge.id, {text: _cca.text}, author);

        //update the data object with challenge comments
        challenge.comments = challenge.comments || [];
        challenge.comments.push({text: _cca.text, author: author});


        ccaPromises.push(ccap);
      }
      return Promise.all(ccaPromises)
        .then(function (ccaps) {
          for(let i=0, len=ccaps.length; i<len; ++i) {
            let cca = collectionCommentAuthor[i];
            cca.author = typeof(cca.author) === 'number' ? users[cca.author].username : cca.author;
            //cca[collectionName] = {id: collections[cca[collectionName]].id};
            cca.id = ccaps[i].id;
            let challenge = challenges[cca[collectionName]];
            challenge.comments[i].id = ccaps[i].id;
          }
          return;
        });
    
    }

    function populateUserFollowCollection(userFollowCollection, users, collections, collectionName) {
      var ufcPromises = [];

      for(let c of collections) {
        c.followers = [];
        c.hiders = [];
      }
      for(let ufc of userFollowCollection) {
        let username = users[ufc.user].username;
        let collection = collections[ufc.collection];
        let hide = ufc.hide === true ? true : false;

        //creating a database.collection.follow() promise and adding it to the array for further Promise.all()
        let ufcp = data[collectionName].follow(collection.id, username, hide);
        ufcPromises.push(ufcp);

        //update the data object's collection Array of followers or hiders with the username
        if(hide === true) {
          collection.hiders.push(username);
        }
        else{
          collection.followers.push(username);
        }
      }

      return Promise.all(ufcPromises)
        .then(function (ufcps) {
          return;
        });
    }

    function populateProjectMember(projectMember, collections, users) {
      var pmPromises = [];

      for(let u of users) {
        u.projects = {
          joining: [],
          invited: [],
          member: []
        };
      }

      for(let p of collections) {
        p.members = {
          joining: [],
          invited: [],
          member: []
        };
      }
      for(let pm of projectMember) {
        let user = users[pm.user];
        let username = users[pm.user].username;
        let collection = collections[pm.collection];
        let status = pm.status;

        //creating a database.collection.follow() promise and adding it to the array for further Promise.all()
        let pmp = data.project.addMember(collection.id, username, status);
        pmPromises.push(pmp);

        //update the data object's collection Array of followers or hiders with the username

        collection.members[status].push({username: user.username, password: user.password});
        user.projects[status].push({id: collection.id});


      }

      return Promise.all(pmPromises)
        .then(function (pmps) {
          return;
        });
    }
    
    /////************** BEGIN building promise chain to return
    let collections = ['idea', 'challenge', 'project', 'discussion'];

    //promise to return
    var ret = populateUsers(dbData.users)
      .then(function () {
        return populateTags(dbData.tags, dbData.users);
      })
      .then(function () {
        return populateUserTag(dbData.userTag, dbData.users, dbData.tags);
      });
    
    //**************** populating collections

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    ret = ret.then(function () {

      let popCol = [];
      for(let col of collections) {
        let Col = capitalize(col);
        let popc = populateCollections(dbData[col + 's'], dbData.users, col)
          .then(function () {
            return populateCollectionTag(dbData[col+'Tag'], dbData[col+'s'], dbData.tags, dbData.users, col);
          })
          .then(function () {
            return populateCollectionCommentAuthor(dbData[col+'CommentAuthor'], dbData[col+'s'], dbData.users, col);
          })
          .then(function () {
            return populateUserFollowCollection(dbData['userFollow'+Col], dbData.users, dbData[col+'s'], col);
          });

        popCol.push(popc);
      }

      return Promise.all(popCol).then(()=>{});
    });
    ///******** finishing with collection specific populating
    ret = ret
      .then(function () {
        return populateProjectMember(dbData.projectMember, dbData.projects, dbData.users);
      })
      .then(function () {
        //console.log(dbData);
      });

    return ret;
  }
  
  /**
   * it promises to clear all the data from database
   *
   *
   */
  function clear() {
    /*
    let promises = [];
    for(let collectionName in dbData) {
      promises.push(db.query('FOR c IN ' + collectionName + ' REMOVE c IN ' + collectionName, {}));
    }

    return Promise.all(promises)
      .then(function () {
        return;
      });
    */
    return db.truncate()
      .then(function () {
        return;
      });
  }

  function init(collections, dbName) {
    db.useDatabase('_system');
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
      .then(function () {})
      .then(null, function (err) {
        db.useDatabase(dbName);
        console.log(err);
        throw (err);
      });
  }

  return {
    init: init,
    populate: populate,
    clear: clear
  };
};
