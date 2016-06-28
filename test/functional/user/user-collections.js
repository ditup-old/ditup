'use strict';

module.exports = function (collection) {
  let collections = collection + 's';
  let colsUp = collections.slice(0,1).toUpperCase()+collections.slice(1);
  // force the test environment to 'test'
  process.env.NODE_ENV = 'development';

  var config = require('../partial/config');
  var funcs = config.funcs;

  var dbConfig = require('../../../services/db-config');//but the app is running on different required db-config!!
  var dbData = require('./dbUserCollections')(collection);

  //set the testing environment
  var deps = config.init({db: dbConfig}, dbData);

  describe('visit /user/:username/'+collections, function () {
    var browser;
    var browserObj = {};

    config.beforeTest(browserObj, deps);
    before(function () {
      browser = browserObj.Value;
    });

    context('logged in', function () {
      let loggedUser = dbData.users[1];
      beforeEach(funcs.login(loggedUser, browserObj));

      beforeEach(function (done) {
        return browser.visit('/user/' + loggedUser.username + '/'+collections)
          .then(done, done);
      });

      afterEach(funcs.logout(browserObj));

      context('the logged user is :username', function () {
        it('should be successful', function () {
          browser.assert.success();
        });

        it('should show list of '+collection+'s user follows', function () {
          browser.assert.element('.following-list');
          browser.assert.text('.following-list .'+collection+' .'+collection+'-name', new RegExp('(?=.*'+collection+'1)'));
          browser.assert.attribute('.following-list .'+collection+'-link.'+collection+'-id-'+dbData[collection+'s'][1].id, 'href', new RegExp('^/'+collection+'/'+dbData[collections][1].id+'.*$'));
        });

        it('should show list of '+collections+' which have common tags with user (sorted by amount of common tags)', function () {
          browser.assert.element('.common-tags-list');
          browser.assert.text('.common-tags-list .'+collection+' .'+collection+'-name', new RegExp('(?=.*'+collection+'1)'));
          browser.assert.text('.common-tags-list li:first-child .common-tagno', '2 tags');
          browser.assert.attribute('.common-tags-list li:first-child .'+collection+'-link', 'href', new RegExp('^/'+collection+'/'+dbData[collections][1].id+'.*$'));
          let tagRegex = '';
          for(let tg of dbData[collections][1].tags) {
            tagRegex += '(?=.*' + tg + ')';
          }
          browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'title', new RegExp(tagRegex));
          browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'data-tooltip', new RegExp(tagRegex));
        });
      });
      context('the logged user is not :username', function () {
        it('we should define what should happen');
      });
    });
    context('not logged in', function () {
      it('should ask to log in to continue');
    });
  });
};
