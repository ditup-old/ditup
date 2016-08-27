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
    
    /*
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
    // */

    context('POST', function () {
      //*
      //we test these fields: /user/:username/edit?field=:field
      let fields = ['name', 'about', 'birthday', 'gender'];

      let goodProfile = {
        name: 'Name',
        surname: 'Surname',
        about: 'some about text',
        birthday: '1988-01-01',
        gender: 'other',
      };

      let longString = 'aaaaaaaa';
      for(let i=0; i<10; ++i) {
        longString += longString;
      }

      let badProfile = {
        name: longString,
        surname: longString,
        about: longString,
        birthday: 'abcde',
        gender: 'nonexistent',
      };

      for(let field of fields) {

        context(`field = ${field}`, function () {
          context('good data', function () {
            //preparation of data for submitting
            let submitData = {
              submit: `.profile-edit-${field} input[type=submit]`
            };
            
            //we select gender from a drop-down menu
            if(field === 'gender') {
              submitData['.profile-edit-gender [name=gender]'] = {
                value: goodProfile.gender,
                action: 'select'
              };
            }
            //other fields have a text input
            else {
              submitData[`.profile-edit-${field} [name=${field}]`] = goodProfile[field];
            }
            
            //name has name and surname (filling the surname, too)
            if(field === 'name') {
              submitData[`.profile-edit-name [name=surname]`] = goodProfile.surname;
            }
            
            //filling the form
            beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=${field}`, submitData, browserObj));

            it(`should update the ${field} with the new data`, function () {
              browser.assert.success();
              browser.assert.redirected();
              browser.assert.url(`/user/${loggedUser.username}`);
              if(field === 'name') {
                browser.assert.text('.profile-name', `${goodProfile.name} ${goodProfile.surname}`);
              }
              else if(field === 'birthday') {
                browser.assert.text('.profile-age', '28 years old');
              }
              else{
                browser.assert.text(`.profile-${field}`, goodProfile[field]);
              }
            });
          });
          context('bad data', function () {
            //preparation of data for submitting
            let submitData = {
              submit: `.profile-edit-${field} input[type=submit]`
            };
            
            //we select gender from a drop-down menu
            if(field === 'gender') {
              submitData['.profile-edit-gender [name=gender]'] = {
                value: badProfile.gender,
                action: 'select'
              };
            }
            //other fields have a text input
            else {
              submitData[`.profile-edit-${field} [name=${field}]`] = badProfile[field];
            }
            
            //name has name and surname (filling the surname, too)
            if(field === 'name') {
              submitData[`.profile-edit-name [name=surname]`] = badProfile.surname;
            }
            
            //filling the form
            beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=${field}`, submitData, browserObj));

            it(`should complain that the ${field} input is in bad format`, function () {
              
            });
          });
        });
      }
      // */

      context('field = tags', function () {
        it('is tested in test/functional/user/tags', () => {});
      });

      context('field = avatar', function () {
        beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=avatar`, {avatar:'/home/michal/fotky/lisboa.jpg', submit: 'Upload!'}, browserObj));
        it('should upload a new image, crop it and resize it and show it', function () {
          browser.assert.success();
          browser.assert.redirected();
          browser.assert.url(`/user/${loggedUser.username}`);
        });
      });
    });
  });

  context('not me', function () {
    it('should show error 403 - not authorized', function (done) {
      return co(function * () {
        try {
          yield browser.visit(`/user/${otherUser.username}/edit?field=name`);
        }
        catch(e) {}
        browser.assert.status(403);
        done();
      }).catch(done);
    });
  });
  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    it('should show error 403 - not authorized', function (done) {
      return co(function * () {
        try {
          yield browser.visit(`/user/${loggedUser.username}/edit?field=name`);
        }
        catch(e) {}
        browser.assert.status(403);
        done();
      }).catch(done);
    });
  });
});
