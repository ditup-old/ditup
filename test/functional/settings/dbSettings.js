'use strict';

let users = 2;
let unverifiedUsers = [1];
let notifications = [0,0,1,1,1];

module.exports = require('../partial/dbCreateData')({users: users, unverified: unverifiedUsers, userFollowUser: [[0,1], [1,0]], notifications: notifications});
