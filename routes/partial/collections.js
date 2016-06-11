'use strict';

module.exports = function (collection, dependencies) {
  let router = dependencies.router;
  let db = dependencies.db;
  let countPastTime = dependencies.countPastTime;

  return router.get('/', function (req, res, next) {
    var sessUser = req.session.user;

    let popular, newest, random;
    //read popular (by followers) collections
    return db[collection].popular('followers')
      .then(function (_pop) {
        popular = _pop;
      })
      //read newest collections
      .then(() => {
        return db[collection].newest();
      })
      .then(function (_new) {
        newest = _new;

        for(let n of newest) {
          //if older than 2 days, show date. otherwise show days/hours/minutes/... passed.
          //let msDay = 3600*1000*24;//miliseconds in a day
          //let showDate = Date.now()-n.created > msDay*2;
          //n.past = showDate ? 'on '+Date(n.created) : countPastTime(n.created);
          n.past = countPastTime(n.created);
        }
      })
      //read random collection(s)
      .then(() => {
        return db[collection].random();
      })
      .then(function (_rand) {
        random = _rand;
      })
      //render
      .then(function () {
        return res.render(collection+'s', {session: sessUser, popular: popular, newest: newest, random: random});
      })
      //catch errors
      .then(null, function (err) {
        next(err);
      })
  });
};

