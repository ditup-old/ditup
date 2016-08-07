'use strict';

let data = {};
const USER_NO = 1;
const DISCUSSION_NO = 2;

//adding users
data.users = [];
for(let i=0; i<USER_NO; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

data.discussions = [];
for(let i=0; i<DISCUSSION_NO; ++i) {
  data.discussions.push({
    name: `test discussion ${i}`,
    description: `some description of discussion ${i}`,
    id: null,
    creator: 0
  });
}

data.userFollowDiscussion = [
  {collection: 1, user: 0}
]

module.exports = data;
