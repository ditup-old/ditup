'use strict';

let co = require('co');
let countPastTime = require('../../services/processing').cpt;
let router = require('express').Router();

module.exports = router;

router.get('/', function (req, res, next) {
  let collection = req.baseUrl.slice(1,-1);
  let db = req.app.get('database');
  var sessUser = req.session.user;
  return co(function *() {
    let lists = {};
    //read popular collections
    lists.popular = yield db[collection].popular('followers');
    //read newest collections
    lists.newest = yield db[collection].newest();
    //count past time for newest collection
    for(let n of lists.newest) {
      n.past = countPastTime(n.created);
    }
    //read random collection(s)
    lists.random = yield db[collection].random();

    if(sessUser.logged === true) {
      lists.following = yield db[collection].following(sessUser.username);
      lists.commonTags = yield db[collection][collection+'sByTagsOfUser'](sessUser.username);
      if(collection === 'project') {
        lists.involved = yield db.project.userProjects(sessUser.username);
      }
    }

    //render
    return res.render(`${collection}s`, {session: sessUser, lists: lists, popular: lists.popular, newest: lists.newest, random: lists.random});
    //popular, newest & random are present for backwards compatibility. the new lists should be added to lists array.

  }).catch(next);
});

