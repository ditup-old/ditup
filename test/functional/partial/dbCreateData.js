'use strict';

module.exports = function (amounts) {
  let data = {};

  const USER_NO = amounts.users || 0;
  const TAG_NO = amounts.tags || 0;

  //creating users
  data.users = [];
  for(let i=0; i<USER_NO; ++i) {
    data.users.push({
      username: `test${i}`,
      password: 'asdfasdf',
      email: `test${i}@example.com`
    });
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

/*
  //adding tags to users
  data.userTag = [];
  for(let i=0; i<TAG_NO-1; ++i) {
    data.userTag.push({
      user: 0,
      tag: i
    });
  }
  for(let i=0; i<TAG_NO-3; ++i) {
    data.userTag.push({
      user: 1,
      tag: i
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
