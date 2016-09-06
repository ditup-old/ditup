'use strict';

let co = require('co');
let generateUrl = require('./functions').generateUrl;

module.exports = function (req, res, next) {
  let db = req.app.get('database');
  return co(function *() {
    var sessUser = req.session.user;
    var id = req.params.id;
    var url = req.params.url;

    let collectionName = req.baseUrl.substr(1);

    req.ditup[collectionName] = req.ditup[collectionName] || {};

    //read the collection
    let collection = yield db[collectionName].read(id);
    let expectedUrl = generateUrl(collection.name);
    collection.url = expectedUrl;
    collection.id = id;
    
    if(url !== expectedUrl) {
      return res.redirect(`/${collectionName}/${id}/${expectedUrl}`);
    }

    collection.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying

    //copying params from previous routes
    for(var param in req.ditup[collectionName]) {
      collection[param] = req.ditup[collectionName][param];
    }

    //read comments of collection
    let comments = yield db[collectionName].readComments(id);
    collection.comments = [];
    for(let comment of comments) {
      collection.comments.push(comment);
    }

    //read tags of collection
    let tags = yield db[collectionName].tags(id);
    collection.tags = [];
    for(let tag of tags) {
      collection.tags.push(tag.name);
    }

    //find out whether user follows the collection 
    if(sessUser.logged === true) {
      collection.following = yield db[collectionName].followingUser(id, sessUser.username)
    }

    //count followers
    collection.followerno = yield db[collectionName].countFollowers(id);

    //sending the response
    if(sessUser.logged !== true) {
      sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> to see more and contribute');
    }

    res.locals.collection = collection;
    return res.render(collectionName);
  })
    .catch(next);
};
