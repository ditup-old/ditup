'use strict';

let data = {};
const USER_NO = 2;
const TAG_NO = 6;
const PROJECT_NO = 1;

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

data.projects = [];
for(let i=0; i<PROJECT_NO; ++i) {
  data.projects.push({
    name: `project${i}`,
    description: 'project description',
    creator: 0,
    join: true,
    join_info: 'info for joiners',
  });
}

data.projectTag = [];
for(let i=0; i<TAG_NO-1; ++i) {
  data.projectTag.push({
    collection: 0,
    tag: i,
    creator: 0
  });
}

data.projectMember = [
  {"collection": 0, "user": 1, "status": "member"}
];

module.exports = data;
