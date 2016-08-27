'use strict';

let rules = {};

rules.user = {
  username: {},
  name: {
    empty: true,
    maxLength: 128
  },
  surname: {
    empty: true,
    maxLength: 128
  },
  birthday: {
    empty: true,
    regex: /^(19|20)[0-9]{2}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
  },
  gender: {
    empty: true,
    list: ['male', 'female', 'other', 'unspecified']
  },
  about: {
    empty: true,
    maxLength: 16384
  }
}


module.exports = rules;
