'use strict';

let users = 20;
let tags = 10;
let challenges = 23;
let ideas = 2;
let projects = 4;
let discussions = 6;

let userTag = [];
for(let i = 0; i<users; ++i) {
  for(let j = 0; j<tags; ++j) {
    let isMainTag = j === 0;
    let isMainToPopulate = isMainTag && i % 2 === 0;
    let isGeneralToPopulate = j !== 0 && j % (i||1) === 0;
    if(isMainToPopulate || isGeneralToPopulate) {
      userTag.push([i,j]);
    }
  }
}

let userFollowChallenge = [];
for(let i = 0; i<users; ++i) {
  for(let j = 0; j<challenges; ++j) {
    if(i!==j && (i % (j+1) === 1 || j%(i+1) === 2))
      userFollowChallenge.push([i,j]);
  }
}

let challengeTag = [];
for(let i = 0; i<challenges; ++i) {
  for(let j = 0; j<tags; ++j) {
    let isMainTag = j === 0;
    let isMainToPopulate = isMainTag && i % 2 === 0;
    let isGeneralToPopulate = j !== 0 && j % (i||1) === 0;
    if(isMainToPopulate || isGeneralToPopulate) {
      challengeTag.push([i,j]);
    }
  }
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

module.exports = require('../partial/dbCreateData')({
  users: users,
  tags: tags,
  challenges: challenges,
  userTag: userTag,
  challengeTag: challengeTag,
  ideas: ideas,
  ideaTag: ideaTag,
  projects: projects,
  discussions: discussions,
  projectTag: projectTag,
  discussionTag: discussionTag,
  userFollowChallenge: userFollowChallenge
});
