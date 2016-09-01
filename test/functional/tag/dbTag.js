'use strict';

let users = 5;
let tags = 3;
let challenges = 7;
let ideas = 2;
let projects = 4;
let discussions = 6;

let userTag = [];
for(let i = 0; i<users; ++i) {
  userTag.push([i,0]);
}

let challengeTag = [];
for(let i = 0; i<challenges; ++i) {
  challengeTag.push([i,0]);
}
let ideaTag = [];
for(let i = 0; i<ideas; ++i) {
  ideaTag.push([i,0]);
}
let discussionTag = [];
for(let i = 0; i<discussions; ++i) {
  discussionTag.push([i,0]);
}
let projectTag = [];
for(let i = 0; i<projects; ++i) {
  projectTag.push([i,0]);
}

module.exports = require('../partial/dbCreateData')({users: users, tags: tags, challenges: challenges, userTag: userTag, challengeTag: challengeTag, ideas: ideas, ideaTag: ideaTag, projects: projects, discussions: discussions, projectTag: projectTag, discussionTag: discussionTag});
