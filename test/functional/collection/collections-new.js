'use strict';

module.exports = function (collection) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require('../collection/dbCollection')(collection);

  let deps = config.init({db: dbConfig}, dbData);

  let funcs = config.funcs;

  var generateUrl = require('../../../routes/collection/functions').generateUrl;

  describe(`visiting /${collection}s/new`, function () {
    let browserObj = {};
    let browser;

    config.beforeTest(browserObj, deps);

    beforeEach(function () { 
      browser = browserObj.Value;
    });

    let loggedUser = dbData.users[0];
    //*
    context('not logged', function () {
      beforeEach(funcs.logout(browserObj));

      it('should show 403 not authorized page', funcs.testError(`/${collection}s/new`, 403, browserObj));
    });
    // */

    context('logged', function () {

      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));

      beforeEach(funcs.visit(`/${collection}s/new`, browserObj));
      
      //*
      context('GET', function () {
        it(`should show the form for creating a ${collection}`, function () {
           //* field for name
           //* field for description
           //* create button
          browser.assert.text(`h1`, `Create a new ${collection}`);
          browser.assert.attribute(`.new-${collection}-form`, `method`, `post`);
          browser.assert.element(`.new-${collection}-form input[type=text][name=name][placeholder=name]`);
          browser.assert.element(`.new-${collection}-form textarea[name=description][placeholder="description (markdown)"]`);
          browser.assert.input(`.new-${collection}-form input[type=submit]`, `create`);
          
          //test project-specific buttons
          if(collection === 'project') {
            browser.assert.elements('.new-project-form input[type=radio]',2);
            browser.assert.attribute('.new-project-form input[type=radio]', 'name', 'joining');
            browser.assert.element('.new-project-form textarea[name=join-info]');
            browser.assert.element('.new-project-form input[type=radio][value=yes]');
            browser.assert.element('.new-project-form input[type=radio][value=no]');
          }
        });
      });
      // */
      
      context('POST', function () {
        var validName = `${collection} name`;
        var emptyName = '';
        var longName = 'name'; //more than 1024 characters
        for (let i = 0; i<10; ++i) {
          longName += longName;
        }

        var validDescription = `this is a valid description of the ${collection} name`;
        var emptyDescription = '';
        var longDescription = '01234567'; //more than 16384 characters
        for (let i = 0; i<12; ++i) {
          longDescription += longDescription;
        }

        var validJoinInfo = 'this is a valid join info';
        var longJoinInfo = longDescription;
        
        //*
        context('bad data', function () {

          function badDataTestCreator(name, description, message, joining, joinInfo) {
            //joining and join info are project specific  
            return function () {
              let formData = {
                name: name,
                description: description,
                submit: 'create'
              }
  
              //filling project specific form fields (joining, join-info)
              if(collection === 'project') {
                formData['join-info'] = joinInfo;
                //sometimes joining can remain unchecked
                if(['yes', 'no'].indexOf(joining) > -1) {
                  formData[`[name=joining][value=${joining}]`] = {
                    action: 'choose'
                  };
                }
              }

              beforeEach(funcs.fill(`/${collection}s/new`, formData, browserObj));

              it('should return a form with a proper error', function () {
                browser.assert.success();
                browser.assert.text(`h1`, `Create a new ${collection}`);
                browser.assert.element(`.new-${collection}-form`);
                browser.assert.text('.popup-message', new RegExp(`^.*${message}.*$`));
              });

              it('should keep the fields filled', function () {
                browser.assert.input('input[name=name]', name);
                browser.assert.input('textarea[name=description]', description);
                if(collection === 'project') {
                  if(['yes', 'no'].indexOf(joining)>-1) {
                    browser.assert.element(`input[name=joining][value=${joining}][checked=checked]`);
                  }
                  browser.assert.input('[name="join-info"]', joinInfo);
                }
              });
            };
          };
        
          context('empty name', badDataTestCreator(emptyName, validDescription, 'the name is too short', 'yes', validJoinInfo));
          context('too long name', badDataTestCreator(longName, validDescription, 'the name is too long', 'no', validJoinInfo));
          context('empty description', badDataTestCreator(validName, emptyDescription, 'the description is too short', 'no', validJoinInfo));
          context('too long description', badDataTestCreator(validName, longDescription, 'the description is too long \\(max 16384 characters\\)', 'yes', validJoinInfo));
          if(collection === 'project') {
            context('unchecked joining', badDataTestCreator(validName, validDescription, 'one of the provided options must be chosen', null, validJoinInfo));
            context('too long joinInfo', badDataTestCreator(validName, validDescription, 'the info for joiners is too long \\(max 16384 characters\\)', 'yes', longJoinInfo));
          }
        });
        // */

        //*
        context('good data', function () {
          let validWeirdName = 'What is a ))_??#@#:@ purpose of test?';

          let validForm = {
            name: validWeirdName,
            description: validDescription,
            submit: 'create'
          }

          if(collection === 'project') {
            validForm['[name=joining][value=yes]'] = {
              action: 'choose'
            },
            validForm['join-info'] = validJoinInfo
          }

          beforeEach(funcs.fill(`/${collection}s/new`, validForm, browserObj));

          it('should be successful', function () {
            browser.assert.success();
          });

          it('should redirect', function () {
            browser.assert.redirected();
          });

          it(`should redirect to the created ${collection} with editing tags`, function () {
            browser.assert.url(new RegExp(`^.*\\/${collection}\\/[0-9]*\\/what-is-purpose-of-test\\/edit\\?field=tags$`));
            browser.assert.text('.collection-name', validWeirdName);
            browser.assert.text('.collection-description', validDescription);
          });

          it(`should say ${collection} created, add some tags`, function () {
            browser.assert.text(`.popup-message`, new RegExp(`^.*the new ${collection} was successfully created. add some tags!.*$`));
          });
         
         /* 
          if(collection === 'project') {
            it('should make the creator a member', function () {
              browser.assert.text('.project-members-number', '1');
              browser.assert.element('.project-members-link');
            });
          }
          */
        });
        // */
      });
    });
  });
};
