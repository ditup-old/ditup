'use strict';

let users = 2;
let unverifiedUsers = [1];

module.exports = require('../partial/dbCreateData')({users: users, unverified: unverifiedUsers});
