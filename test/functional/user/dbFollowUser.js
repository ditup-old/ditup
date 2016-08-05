'use strict';

let data = {};
const USER_NO = 3;

//adding users
data.users = [];
for(let i=0; i<USER_NO; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

data.userFollowUser = [
  {followed: 2, follower: 0}
]

module.exports = data;
