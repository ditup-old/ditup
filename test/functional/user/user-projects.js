'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
var dbData = require('./dbUserProjects');
let generateUrl = require('../../../routes/collection/functions').generateUrl;
var testCollections = require('../partial/collections');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('visit /user/:username/projects', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];

  //***********tests
  let dependencies = {
    browser: browserObj,
    functions: funcs,
  };

  context('logged in', function () {
    let loggedUser = dbData.users[1];
    beforeEach(funcs.login(loggedUser, browserObj));

    beforeEach(funcs.visit('/projects', browserObj));

    afterEach(funcs.logout(browserObj));

    context('the logged user is :username', function () {
      it('should be successful', function () {
        browser.assert.success();
      });
      it('should show list of projects user is involved in (member/invited/joining)', function () {
        browser.assert.element('.involved-list');
        browser.assert.text('.involved-list .project .project-name', new RegExp('(?=.*project0)(?=.*project1)(?=.*project2)'));
        browser.assert.attribute('.involved-list .project-link.project-id-'+dbData.projects[0].id, 'href', new RegExp('^/project/'+dbData.projects[0].id+'.*$'));
        browser.assert.text('.involved-list .project-involvement', new RegExp('(?=.*joining)(?=.*invited)(?=.*member)'));
      });
      it('should show list of projects user follows', function () {
        browser.assert.element('.following-list');
        browser.assert.text('.following-list .project .project-name', new RegExp('(?=.*project1)'));
        browser.assert.attribute('.following-list .project-link.project-id-'+dbData.projects[1].id, 'href', new RegExp('^/project/'+dbData.projects[1].id+'.*$'));
      });
      it('should show list of projects which have common tags with user (sorted by amount of common tags)', function () {
        browser.assert.element('.common-tags-list');
        browser.assert.text('.common-tags-list .project .project-name', new RegExp('(?=.*project1)'));
        browser.assert.attribute('.common-tags-list li:first-child .project-link', 'href', new RegExp('^/project/'+dbData.projects[1].id+'.*$'));
        browser.assert.text('.common-tags-list li:first-child .common-tagno', '2 tags');
        let tagRegex = '';
        for(let tg of dbData.projects[1].tags) {
          tagRegex += '(?=.*'+tg+')';
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
