'use strict';

module.exports = function (collection) {
  let collections = collection + 's';
  let colUp = collection.slice(0,1).toUpperCase()+collection.slice(1);
  let colsUp = colUp + 's';

  let data = {
    "users": [
      {
        "username": "test0",
        "password": "asdfasdf",
        "email": "test0@example.com"
      },
      {
        "username": "test1",
        "password": "asdfasdf",
        "email": "test1@example.com"
      },
      {
        "username": "test2",
        "password": "asdfasdf",
        "email": "test2@example.com"
      },
      {
        "username": "test3",
        "password": "asdfasdf",
        "email": "test3@example.com"
      },
      {
        "username": "test4",
        "password": "asdfasdf",
        "email": "test4@example.com"
      }
    ],
    "tags": [
      {
        "name": "tag0",
        "description": "this is the tag0",
        "creator": 0
      },
      {
        "name": "tag1",
        "description": "this is the tag1",
        "creator": 0
      },
      {
        "name": "tag2",
        "description": "this is a description of the tag2",
        "creator": 1
      },
      {
        "name": "tag3",
        "description": "this is some other description of the tag",
        "creator": 1
      },
      {
        "name": "tag4",
        "description": "this is some other description of the tag",
        "creator": 0
      },
      {
        "name": "tag5",
        "description": "this is some other description of the tag",
        "creator": 0
      }
    ],
    "discussions": [],
    "challenges": [],
    "ideas": [
    ],
    "projects": [
    ],
    "challengeCommentAuthor": [],
    "discussionCommentAuthor": [],
    "ideaCommentAuthor": [],
    "projectCommentAuthor": [],
    "userFollowChallenge": [],
    "userFollowDiscussion": [],
    "userFollowIdea": [
    ],
    "userFollowProject": [
    ],
    "userTag": [
      {"user":0, "tag": 0},
      {"user":0, "tag": 2},
      {"user":0, "tag": 4},
      {"user":0, "tag": 5},
      {"user":1, "tag": 1},
      {"user":1, "tag": 2},
      {"user":1, "tag": 3},
      {"user":1, "tag": 4},
      {"user":2, "tag": 4},
      {"user":3, "tag": 1},
      {"user":3, "tag": 5}
    ],
    "discussionTag": [
    ],
    "challengeTag": [
    ],
    "ideaTag": [
    ],
    "projectTag": [
    ],
    "projectMember": []
  }

  //filling collections
  for(let i=0; i<3; ++i) {
    data[collections].push({
      "name": collection+i,
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      "id": null,
      "creator": i
    });
  }

  //fixing deprecated discussion topic
  if(collections === 'discussions') {
    for(let col of data[collections]) {
      col.topic = col.name;
    }
  }
  
  data['userFollow'+colUp] = [
    {"user":0,"collection":0},
    {"user":1,"collection":0,"hide":true},
    {"user":1,"collection":1},
    {"user":2,"collection":0},
    {"user":3,"collection":0},
    {"user":4,"collection":0,"hide":true}
  ];

  data[collection+'Tag'] = [
    {collection:0,"tag":0,"creator":1},
    {collection:0,"tag":1,"creator":0},
    {collection:0,"tag":2,"creator":1},
    {collection:0,"tag":3,"creator":2},
    {collection:1,"tag":1,"creator":3},
    {collection:1,"tag":3,"creator":3},
    {collection:2,"tag":2,"creator":4},
    {collection:2,"tag":5,"creator":1}
  ];

  return data;
};
