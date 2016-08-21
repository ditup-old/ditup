'use strict';

/**
 * these are router functions reused by different dits
 *
 */


let co = require('co');
let express = require('express');
var functions = require('../collection/functions');
var generateUrl = functions.generateUrl;

let exp = {};

//read the collection
exp.readCollection = express.Router().all('/:id/:url/edit', function (req, res, next) {
  let dittype = req.baseUrl.substring(1);
  let db = req.app.get('database');
  let sessUser = req.session.user;
  let id = req.params.id;

  return co(function *() {
    req.ditup.collection = yield db[dittype].read(id);
    return next();
  })
    .catch(next);
});

//test rights to edit (creator)
exp.editRightsCreator = express.Router().all('/:id/:url/edit', function (req, res, next) {
  let sessUser = req.session.user;
  let authorized;

  if(sessUser.logged && req.ditup.collection.creator.username === sessUser.username) {
    authorized = true;
  }

  if(authorized !== true) {
    let err = new Error('Not Authorized');
    err.status = 403;
    return next(err);
  }
  return next();
});

//test rights to edit (member)
exp.editRightsMember = express.Router().all('/:id/:url/edit', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    let sessUser = req.session.user;
    let id = req.params.id;
    let authorized;

    if(sessUser.logged) {
      let involvement = yield db.project.userStatus(id, sessUser.username);
      if(involvement === 'member') authorized = true;
    }

    if(authorized !== true) {
      let err = new Error('Not Authorized');
      err.status = 403;
      throw err;
    }
    return next();
  })
    .catch(next);
});

//GET: redirect if necessary TODO

//display the collection-edit view
exp.displayEditView = function (fields) {
  return express.Router().all('/:id/:url/edit', function (req, res, next) {
    let dittype = req.baseUrl.substring(1);
    let db = req.app.get('database');
    let sessUser = req.session.user;

    //find out which fields to edit
    let editFields = [];
    for(let field of fields) {
      if(req.query.field === field) editFields.push(field);
    }


    var id = req.params.id;
    var url = req.params.url;
    req.ditup.collection = req.ditup.collection || {};

    return co(function *() {
      //read the collection (we already did it)
      var collection = req.ditup.collection;
      collection.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
      collection.id = id;
      collection.url = generateUrl(collection.name);


      //read tags of collection
      let tags = yield db[dittype].tags(id);
      collection.tags = [];
      for(let tag of tags) {
        collection.tags.push(tag.name);
      }

      //sending the response
      return res.render(`${dittype}-edit`, {session: sessUser, collection: collection, edit: editFields});
    })
      .catch(next);
  });
};

exp.post = function (fields) {
  return express.Router().post('/:id/:url/edit', function (req, res, next) {
    return co(function *() {
      let db = req.app.get('database');
      let sessUser = req.session.user;
      let dittype = req.baseUrl.substring(1);
      let collectionName = dittype;

      //find out which fields to edit
      let editFields = [];
      for(let field of fields) {
        if(req.query.field === field) editFields.push(field);
      }

      var id = req.params.id;
      var url = req.params.url;
      
      let inside = false;
      for(let field of fields) {
        if(editFields.indexOf(field)>-1) {

          //checking that we had some correct field
          inside = true;

          if(field === 'tags') {
            if(req.body.action === 'add tag') {
              let tagname = req.body.tagname;
              let exists = yield db.tag.exists(tagname);
              if(exists) {
                yield db[dittype].addTag(id, tagname, req.session.user.username);
                req.session.messages.push(`the tag ${req.body.tagname} was added to the ${dittype}`);
              }
              else {
                return res.render('tag-create-add', {tag: {name: req.body.tagname}});
              }
            }
            else if(req.body.action === 'create and add tag') {
              let tagname = req.body.tagname;
              //TODO validation
              //
              //create the tag
              yield db.tag.create({
                name: tagname,
                description: req.body.description,
                meta: {
                  creator: req.session.user.username
                }
              });
              //add the tag to the dit
              yield db[dittype].addTag(id, tagname, sessUser.username);
              //make a message
              req.session.user.messages.push(`the tag ${req.body.tagname} was created and added to the ${collectionName}`);
              return next();
            }
            else if(dittype === 'project' && req.body.action === 'remove tag') {
              let tagname = req.body.tagname;
              yield db.project.removeTag(id, tagname);
            }
          }
          else{
            //we are editing
            let data = req.body[field];
            //TODO validate the data
            yield db[dittype].updateField(id, data, field);
            req.session.messages.push(`the ${field} was updated`);
          }
          let redirectUrl = field === 'name' ? generateUrl(data) : url;
          return res.redirect(`/${dittype}/${id}/${redirectUrl}`);
        }
      }
      if(inside !== true) {
        throw new Error('unrecognized POST request');
      }
    })
      .catch(function (e) {
        //error code if duplicate adding (we don't show error page, but message & edit page without error)
        if(e.code === 409) {
          req.session.user.messages.push(`the tag ${req.body.tagname} is already added`);
          return next();
        }
        return next(e);
      });
  });
};

module.exports = exp;
