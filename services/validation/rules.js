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
  },
  email: {
    maxLength: 1024,
    regex: /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
  },
  password: {
    minLength: 8,
    maxLength: 256
  }
}

rules.tag = {
  tagname: {
    empty: false,
    minLength: 2,
    maxLength: 64,
    regex: /^[a-z0-9]+(\-[a-z0-9]+)*$/
  },
  description: {
    empty: true,
    maxLength: 2048
  }
}

rules.comment = {
  text: {
    empty: false,
    minLength: 1,
    maxLength: 16384
  }
}

rules.collection = {
  name: {
    minLength: 1,
    maxLength: 1024,
    regex: /([^\s])/
  },
  description: {
    minLength: 1,
    maxLength: 16384,
    regex: /([^\s])/
  }
}

rules.project = {
  joining: {
    list: ['yes', 'no']
  },
  joinInfo: {
    empty: true,
    maxLength: 16384
  }
}

module.exports = rules;
