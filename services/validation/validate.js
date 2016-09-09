'use strict';

let rules = require('./rules.js');

let validate = {};

//here we build the validate object
//i.e. validate.user.name = function (value); will return or throw error
for(let collection in rules) {
  validate[collection] = validate[collection] || {};

  for(let field in rules[collection]) {
    validate[collection][field] = function (value) {
      return vldt(value, rules[collection][field], field);
    }
  }
}

//this function is doing the validation itself.
function vldt(value, rules, fieldName) {
  let err = new Error();
  err.detail = {
    field: fieldName,
  }
  err.status = 400;
  for(let rule in rules) {
    if(rule === 'empty') {
      //if the empty: true, field can be empty. if the field is empty, return field as valid.
      if(rules[rule] === true && value === '') return;
    }
    if(rule === 'minLength') {
      let valid = typeof(value) === 'string' && value.length >= rules.minLength;
      if(!valid) {
        err.message = `the minimal length of ${fieldName || 'field'} is ${rules.minLength}`;
        err.detail.rule = rule;
        throw err;
      }
    }
    if(rule === 'maxLength') {
      let valid = typeof(value) === 'string' && value.length <= rules.maxLength;
      if(!valid) {
        err.message = `the maximal length of ${fieldName || 'field'} is ${rules.maxLength}`;
        err.detail.rule = rule;
        throw err;
      }
    }
    if(rule === 'list') {
      let valid = rules[rule].indexOf(value) > -1;
      if(!valid) {
        err.message = `the field ${fieldName} must be a value from the list [${rules[rule].join(', ')}]`;
        err.detail.rule = rule;
        throw err;
      }
    }
    if(rule === 'regex' || rule === 'regexp') {
      //validating the value against regexp
      let regex = new RegExp(rules[rule]);
      let valid = regex.test(value);
      if(!valid) {
        err.message = `the field ${fieldName} must have a form ${rules[rule]}`;
        err.detail.rule = 'regex';
        throw err;
      }
    }
  }
  return;
}

module.exports = validate;
