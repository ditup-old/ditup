'use strict';

module.exports = function (amounts) {
  let data = {};

  const USER_NO = amounts.users || 0;
  const TAG_NO = amounts.tags || 0;
  const CHALLENGE_NO = amounts.challenges || 0;
  const IDEA_NO = amounts.ideas || 0;
  const PROJECT_NO = amounts.projects || 0;
  const DISCUSSION_NO = amounts.discussions || 0;
  amounts.challengeTag = amounts.challengeTag || [];
  amounts.ideaTag = amounts.ideaTag || [];
  amounts.userTag = amounts.userTag || [];
  amounts.projectTag = amounts.projectTag || [];
  amounts.discussionTag = amounts.discussionTag || [];
  const UNVERIFIED = amounts.unverified || [];

  //creating users
  data.users = [];
  for(let i=0; i<USER_NO; ++i) {
    data.users.push({
      username: `test${i}`,
      password: 'asdfasdf',
      email: `test${i}@example.com`
    });

    if(UNVERIFIED.indexOf(i)>-1) data.users[i].verified = false;
  }

/*
  var gender = ['male', 'female', 'other'];
  data.userProfiles = [];

  for(let i=0; i<USER_NO; ++i) {
    data.userProfiles.push({
      user: i,
      name: `name${i}`,
      surname: `surname${i}`,
      gender: gender[i % gender.length],
      birthday: '1997-08-08',
      about: `this is some about text

  which has multiple lines

  and is \`marked\` with __markdown__`
    });
  }
// */
  //creating tags
  data.tags = [];
  for(let i=0; i<TAG_NO; ++i) {
    data.tags.push({
      tagname: `tag${i}`,
      description: 'tag description',
      creator: i % USER_NO
    });
  }

  //creating challenges
  data.challenges = [];
  for(let i=0; i<CHALLENGE_NO; ++i) {
    data.challenges.push({
      name: `challenge${i}`,
      description: 'challenge description',
      creator: i % USER_NO
    });
  }

  //creating ideas
  data.ideas = [];
  for(let i=0; i<IDEA_NO; ++i) {
    data.ideas.push({
      name: `idea${i}`,
      description: 'idea description',
      creator: i % USER_NO
    });
  }

  //creating projects
  data.projects = [];
  for(let i=0; i<PROJECT_NO; ++i) {
    data.projects.push({
      name: `project${i}`,
      description: 'project description',
      creator: i % USER_NO,
      join: true,
      join_info: 'some info for joiners'
    });
  }

  //creating discussions
  data.discussions = [];
  for(let i=0; i<DISCUSSION_NO; ++i) {
    data.discussions.push({
      name: `discussion${i}`,
      description: 'discussion description',
      creator: i % USER_NO
    });
  }

//*
  //adding tags to users
  data.userTag = [];
  for(let ut of amounts.userTag) {
    data.userTag.push({
      user: ut[0],
      tag: ut[1]
    });
  }
// */
//*
  //adding tags to challenges
  data.challengeTag = [];
  for(let ct of amounts.challengeTag) {
    data.challengeTag.push({
      collection: ct[0],
      tag: ct[1],
      creator: (ct[0]+ct[1]) % USER_NO
    });
  }
// */
//*
  //adding tags to ideas
  data.ideaTag = [];
  for(let it of amounts.ideaTag) {
    data.ideaTag.push({
      collection: it[0],
      tag: it[1],
      creator: (it[0]+it[1]) % USER_NO
    });
  }
// */
//*
  //adding tags to projects
  data.projectTag = [];
  for(let it of amounts.projectTag) {
    data.projectTag.push({
      collection: it[0],
      tag: it[1],
      creator: (it[0]+it[1]) % USER_NO
    });
  }
// */
//*
  //adding tags to discussions
  data.discussionTag = [];
  for(let it of amounts.discussionTag) {
    data.discussionTag.push({
      collection: it[0],
      tag: it[1],
      creator: (it[0]+it[1]) % USER_NO
    });
  }
// */

/*
  //users following each other
  data.userFollowUser = [];
  for(let i=0; i<USER_NO-1; ++i) {
    data.userFollowUser.push({
      follower: i+1,
      followed: 0
    });
  }
// */

  return data;
}
