'use strict';

let data = {};
const USER_NO = 1;
const PROJECT_NO = 2;

//adding users
data.users = [];
for(let i=0; i<USER_NO; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

data.projects = [];
for(let i=0; i<PROJECT_NO; ++i) {
  data.projects.push({
    name: `test project ${i}`,
    description: `some description of project ${i}`,
    join: true,
    join_info: "this is an info for the people who want to join. it will be shown after clicking the JOIN button (or the default will be shown if empty)",
    id: null,
    creator: 0
  });
}

data.userFollowProject = [
  {collection: 1, user: 0}
]

module.exports = data;
