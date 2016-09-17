'use strict';

let create = require('../partial/dbCreateData');

const USER_NO = 20;
let dataObject = {users: USER_NO};

//users[1] will follow every third user
//every second user will follow users[1]
dataObject.userFollowUser = [];
for(let i=0; i<USER_NO; ++i) {
  if(i % 2 === 0) {
    dataObject.userFollowUser.push([i, 1]);
  }
  if(i % 3 === 0) {
    dataObject.userFollowUser.push([1, i]);
  }
}

module.exports = create(dataObject);
