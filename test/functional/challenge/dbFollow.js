'use strict';

let data = {};
const USER_NO = 1;
const CHALLENGE_NO = 2;

//adding users
data.users = [];
for(let i=0; i<USER_NO; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

data.challenges = [];
for(let i=0; i<CHALLENGE_NO; ++i) {
  data.challenges.push({
    name: `test challenge ${i}`,
    description: `some description of challenge ${i}`,
    join: true,
    join_info: "this is an info for the people who want to join. it will be shown after clicking the JOIN button (or the default will be shown if empty)",
    id: null,
    creator: 0
  });
}

data.userFollowChallenge = [
  {collection: 1, user: 0}
]

module.exports = data;
