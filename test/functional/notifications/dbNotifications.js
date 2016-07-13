'use strict';

module.exports = (function () {
  const USERS = 5;
  const TAGS = 6;

  let data = {
    "users": [
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
      {
        "name": "project0",
        "description": "some description",
        "join": true,
        "join_info": "this is an info for the people who want to join. it will be shown after clicking the JOIN button (or the default will be shown if empty)",
        "id": null,
        "creator": 0
      },
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
    "projectMember": [
      {"collection": 0, "user": 0, "status": "joining"},
      {"collection": 0, "user": 1, "status": "member"}
    ],
    "messages": [
    ],
    "notifications": [
      {
        "to":0,
        "text": "you are notified, go to projects",
        "url": "/projects"
      },
      {
        "to":0,
        "text": "you are notified, go to projects",
        "url": "/projects"
      },
      {
        "to":0,
        "text": "you are notified, go to projects",
        "url": "/projects"
      },
      {
        "to":1,
        "text": "you are notified, go to projects",
        "url": "/projects"
      },
      {
        "to":1,
        "text": "you are notified, go to projects",
        "url": "/projects"
      },
      {
        "to":2,
        "text": "you are notified, go to projects",
        "url": "/projects"
      }
    ]
  }

  for(let i=0; i<USERS; ++i) {
    data.users.push({
      "username": "test"+i,
      "password": "asdfasdf",
      "email": "test"+i+"@example.com"
    });
  }

  return data;
})();
