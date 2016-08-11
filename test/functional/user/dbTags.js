'use strict';

let data = {};
const USER_NO = 3;
const TAG_NO = 6;

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
    creator: 0
  });
}

data.userTag = [];
for(let i=0; i<TAG_NO-1; ++i) {
  data.userTag.push({
    user: 0,
    tag: i
  });
}
for(let i=0; i<TAG_NO-3; ++i) {
  data.userTag.push({
    user: 1,
    tag: i
  });
}

module.exports = data;
