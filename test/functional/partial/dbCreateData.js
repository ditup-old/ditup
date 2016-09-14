'use strict';

module.exports = function (amounts) {
  let data = {};

  let collections = ['challenge', 'idea', 'discussion', 'project'];

  const USER_NO = amounts.users || 0;
  const TAG_NO = amounts.tags || 0;
  const CHALLENGE_NO = amounts.challenges || 0;
  const IDEA_NO = amounts.ideas || 0;
  const PROJECT_NO = amounts.projects || 0;
  const DISCUSSION_NO = amounts.discussions || 0;
  amounts.userTag = amounts.userTag || [];
  amounts.userFollowUser = amounts.userFollowUser || [];
  amounts.projectMember = amounts.projectMember || [];

  for(let collection of collections) {
    //userFollowCollection
    amounts[`userFollow${collection.substr(0,1).toUpperCase()}${collection.substr(1)}`] = amounts[`userFollow${collection.substr(0,1).toUpperCase()}${collection.substr(1)}`] || [];
    //collectionTag
    amounts[`${collection}Tag`] = amounts[`${collection}Tag`] || [];
  }
  amounts.notifications = amounts.notifications || [];
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
  //adding tags to collections
  for(let collection of collections) {
    let collectionTag = `${collection}Tag`;
    data[collectionTag] = [];
    for(let ct of amounts[collectionTag]) {
      data[collectionTag].push({
        collection: ct[0],
        tag: ct[1],
        creator: (ct[0]+ct[1]) % USER_NO
      });
    }
  }

//*
  //users following each other
  data.userFollowUser = [];
  for(let ufu of amounts.userFollowUser) {
    data.userFollowUser.push({
      follower: ufu[0],
      followed: ufu[1]
    });
  }
// */
  
//*
  //user following collections
  for(let collection of collections) {
    let Collection = `${collection.substr(0,1).toUpperCase()}${collection.substr(1)}`;
    let userFollowCollection = `userFollow${Collection}`;
    data[userFollowCollection] = [];
    for(let ufd of amounts[userFollowCollection]) {
      data[userFollowCollection].push({
        user: ufd[0],
        collection: ufd[1]
      });
    }
  }

// */

  data.notifications = [];
  for(let userno of amounts.notifications) {
    data.notifications.push({
      to: userno,
      text: "you are notified, go to projects",
      url: "/projects"
    });
  }

  data.projectMember = [];
  for(let pm of amounts.projectMember) {
    data.projectMember.push({
      collection: pm[0],
      user: pm[1],
      status: pm[2]
    });
  }

  return data;
}
