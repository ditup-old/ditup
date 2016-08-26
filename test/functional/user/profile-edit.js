'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require(`./dbProfile`);
let co = require('co');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('/user/:username/profile/edit', function () {
  // ********** preparation
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });
  // ***********end of preparation
  //
  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];


  context('me', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));

    context('GET', function () {
      let tests = {
        name: [
          [
            'should show form for editing name and surname',
            function () {
              browser.assert.element('.profile-edit-name');
              browser.assert.input('.profile-edit-name input[name=name]', loggedUser.profile.name);
              browser.assert.input('.profile-edit-name input[name=surname]', loggedUser.profile.surname);
            }
          ]
        ],
        about: [
          [
            'should show form for editing about',
            function () {
              browser.assert.element('.profile-edit-about');
              browser.assert.input('.profile-edit-about textarea[name=about]', loggedUser.profile.about);
            }
          ]
        ],
        tags: [
          ['should succeed', function () {browser.assert.success();}],
          ['is tested in test/functional/user/tags', () => {}]
        ],
        birthday: [
          [
            'should show form for editing birthday',
            function () {
              browser.assert.element('.profile-edit-birthday');
              browser.assert.input('.profile-edit-birthday input[name=birthday]', loggedUser.profile.birthday);
            }
          ]
        ],
        gender: [
          [
            'should show form for editing gender',
            function () {
              browser.assert.element('.profile-edit-gender');
              browser.assert.input('.profile-edit-gender [name=gender]', loggedUser.profile.gender);
            }
          ]
        ],
        avatar: [
          [
            'should show form for changing profile picture',
            function () {
              browser.assert.element('.profile-edit-avatar');
              browser.assert.element('.profile-edit-avatar input[name=avatar]');
            }
          ]
        ],
        otherField: [
          ['should show error unrecognized field']
        ]
      }

      for(let field in tests) {
        context(`field=${field}`, function () {
          beforeEach(funcs.visit(`/user/${loggedUser.username}/edit?field=${field}`, browserObj));

          for(let test of tests[field]) {
            it(test[0], test[1]);
          }
        });
      }
    });

    context('POST', function () {
      let fields = ['name', 'about', 'birthday', 'gender', 'avatar'];

      for(let field of fields) {
        context(`field = ${field}`, function () {
          context('good data', function () {
            it(`should update the ${field} with the new data`);
          });
          context('bad data', function () {
            it(`should complain that the ${field} input is in bad format`)
          });
        });
      }
      //*
      context('field = tags', function () {
        it('is tested in test/functional/user/tags', () => {});
      });
      // */
    });
  });

  context('not me', function () {
    it('should show error 403 - not authorized');
  });
  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    it('should show error 403 - not authorized');
  });
});
