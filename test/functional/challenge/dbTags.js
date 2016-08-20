'use strict';

let data = {};
const USER_NO = 1;
const TAG_NO = 6;
const CHALLENGE_NO = 1;

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

data.challenges = [];
for(let i=0; i<CHALLENGE_NO; ++i) {
  data.challenges.push({
    name: `challenge${i}`,
    description: 'challenge description',
    creator: 0
  });
}

data.challengeTag = [];
for(let i=0; i<TAG_NO-1; ++i) {
  data.challengeTag.push({
    collection: 0,
    tag: i,
    creator: 0
  });
}

module.exports = data;
