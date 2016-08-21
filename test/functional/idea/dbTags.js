'use strict';

let data = {};
const USER_NO = 2;
const TAG_NO = 6;
const IDEA_NO = 1;

//adding users
data.users = [];
for(let i=0; i<USER_NO; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

data.tags = [];
for(let i=0; i<TAG_NO; ++i) {
  data.tags.push({
    name: `tag${i}`,
    description: 'tag description',
    creator: 1
  });
}

data.ideas = [];
for(let i=0; i<IDEA_NO; ++i) {
  data.ideas.push({
    name: `idea${i}`,
    description: 'idea description',
    creator: 1
  });
}

data.ideaTag = [];
for(let i=0; i<TAG_NO-1; ++i) {
  data.ideaTag.push({
    collection: 0,
    tag: i,
    creator: 1
  });
}

module.exports = data;
