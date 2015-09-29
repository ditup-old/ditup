'use strict';

var user = {};
var dit = {};


var exports = module.exports = {
  user: user,
  dit: dit
};


user.view = function (me, user) {
  //TODO involve user settings
  var amILogged = me.logged === true ? true : false;
  var canIView = amILogged;

  return canIView;
};

user.edit = function (me, user) {
  var isItMe = me.logged === true && me.username === user.username;
  var canIEdit = isItMe;

  return canIEdit;
};


dit.view = function (me, dit, relation) {
  /****
  1. if not logged in, view: false
    else if all, view: true
    else if members && i'm member || admin: view: true
    else if members && i'm admin: view: true
    else if admins && i'm admin: view: 
  ****/
  //console.log(dit);

  var viewSettings = dit.settings.view;

  var view = false;

  if(relation === 'admin') {
    view = true;
  }

  if (viewSettings === 'all') {
    view = true;
  }
  else if (viewSettings === 'members' && (relation === 'member' || relation === 'admin')){
    view = true;
  }
  else if (viewSettings === 'admins' && relation === 'admin'){
    view = true;
  }
  return view;
};

dit.edit = function (me, dit, relation) {
  /****
  1. if not logged in, view: false
     else if all, view: true
     else if members && i'm member || admin: view: true, edit: fa
     else if members && i'm admin: view: true, edit: true
     else if admins && i'm admin: view: 
  ****/

  var editSettings = dit.settings.edit || 'admins';

  var edit = false;
  if(relation === 'admin'){
    edit = true;
  }

  if (editSettings === 'all') {
    edit = true;
  }
  else if (editSettings === 'members' && (relation === 'member' || relation === 'admin')){
    edit = true;
  }
  else if (editSettings === 'admins' && relation === 'admin'){
    edit = true;
  }
  return edit;
};

dit.join = function (dit) {
  //TODO base it on dit settings
  return true;
};

dit.addUser = function (user, dit, relation) {
  console.log(user, dit, relation);
  return relation === 'admin' ? true : false;
};


var getMyRightsToDit = function (me, dit) {
  /****
  1. if not logged in, view: false
     else if all, view: true
     else if members && i'm member || admin: view: true, edit: fa
     else if members && i'm admin: view: true, edit: true
     else if admins && i'm admin: view: 
  ****/
  //console.log(dit);
  if(me.logged !== true) {
    return Q.resolve({
      view: false,
      edit: false
    });
  }

  var viewSettings = dit.settings.view;

  return database.readMemberOf(me, dit)
    .then(function (edge) {
      var relation = edge === null ? null : edge.relation;
      var view = false;
      var edit = false;
      if(relation === 'admin'){
        view = true;
        edit = true;
      }

      if (viewSettings === 'all') {
        view = true;
      }
      else if (viewSettings === 'members' && (relation === 'member' || relation === 'admin')){
        view = true;
      }
      else if (viewSettings === 'admins' && relation === 'admin'){
        view = true;
      }
      return {view: view, edit: edit, relation: relation};
    });
};
