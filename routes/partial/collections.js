'use strict';

let co = require('co');

module.exports = function (collection, dependencies) {
  let router = require('express').Router();
  let countPastTime = dependencies.countPastTime;

  return router.get('/', function (req, res, next) {
    let db = req.app.get('database');
    var sessUser = req.session.user;
    return co(function *() {
      let lists = {};
      //read popular collections
      lists.popular = yield db[collection].popular('followers');
      //read newest collections
      lists.newest = yield db[collection].newest();
      for(let n of lists.newest) {
        //if older than 2 days, show date. otherwise show days/hours/minutes/... passed.
        //let msDay = 3600*1000*24;//miliseconds in a day
        //let showDate = Date.now()-n.created > msDay*2;
        //n.past = showDate ? 'on '+Date(n.created) : countPastTime(n.created);
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
};

