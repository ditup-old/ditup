'use strict';

var exports = module.exports = {};


var dit = exports.dit = {};

dit.view = function () {

};

dit.edit = function () {

};

dit.join = function (dit) {
  //TODO base it on dit settings
  return true;
};

dit.addUser = function (user, dit, relation) {
  console.log(user, dit, relation);
  return relation === 'admin' ? true : false;
};
