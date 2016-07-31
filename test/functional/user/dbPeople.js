'use strict';

let data = {
  "users": [
  ],
  "tags": [
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
    {"user":3, "tag": 5},
    {"user":4, "tag": 4},
    {"user":5, "tag": 4},
    {"user":6, "tag": 0}
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

for(let i=0; i<10; ++i) {
  data.users.push({
    username: `test${i}`,
    password: 'asdfasdf',
    email: `test${i}@example.com`
  });
}

for(let i=0; i<10; ++i) {
  data.tags.push({
    "name": `tag${i}`,
    "description": `this is the tag${i}`,
    "creator": 0
  });
}

module.exports = data;
