'use strict';

module.exports = function (collectionName) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require(`./dbCollections`)(collectionName);

  let deps = config.init({db: dbConfig}, dbData);
  let funcs = config.funcs;

  describe(`visiting /${collectionName}s`, function () {
    let browserObj = {};
    let browser;

    let collection = collectionName;
    let collections = `${collectionName}s`;

    config.beforeTest(browserObj, deps);

    beforeEach(function () {
      browser = browserObj.Value;
    });
  
    var loggedUser = dbData.users[1];

    beforeEach(funcs.visit(`/${collectionName}s`, browserObj));

    it(`should show 5 popular ${collection}s`, function () {
      browser.assert.element('.popular-list-followers'); //the list is there
      browser.assert.elements(`.popular-list-followers .${collection}`, 5); //there is 5 of them
      browser.assert.text(`.popular-list-followers .${collection} .${collection}-name`, `${collection}3${collection}5${collection}4${collection}6${collection}7`); //the names of collections are displayed
      browser.assert.link(`.popular-list-followers a`, `${collection}3`, new RegExp(`/${collection}/${dbData[collections][3].id}.*`)); //links to collection pages
      browser.assert.text('.popular-list-followers li:first-child .followerno', '5 followers');
    });
    it(`should show 5 new ${collections}`, function () {
      browser.assert.element('.new-list'); //the list is there
      browser.assert.elements(`.new-list .${collection}`, 5); //there is 5 of them
      browser.assert.link(`.new-list a`, `${collection}7`, new RegExp(`/${collection}/${dbData[collections][7].id}.*`)); //links to collection pages
      browser.assert.elements(`.${collection} .created`, 5);
    });
    it(`should show 1 random ${collection}`, function () {
      browser.assert.element('.random-list'); //the list is there
      browser.assert.elements(`.random-list .${collection}`, 1); //there is 5 of them
    });
    it(`should show 5 recently active ${collection}s`);
    it(`may show some trending ${collection}s`); //trending collection is a collection with many comments or new followers in last 24 hours (or different time period)

    
    context('logged', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));

      beforeEach(funcs.visit(`/${collection}s`, browserObj));

      it(`should show create new ${collection} button`, function () {
        browser.assert.element(`.create-new-${collection}`);
        browser.assert.link(`.create-new-${collection}`, `Create a new ${collection}`, `/${collection}s/new`);
      });

      it(`should show list of ${collection}s user follows`, function () {
        browser.assert.element('.following-list');
        browser.assert.text(`.following-list .${collection} .${collection}-name`, new RegExp(`(?=.*${collection}7)`));
        browser.assert.attribute(`.following-list .${collection}-link.${collection}-id-${dbData[collections][7].id}`, `href`, new RegExp(`^/${collection}/${dbData[collections][7].id}.*$`));
      });

      it(`should show list of ${collections} which have common tags with user (sorted by amount of common tags)`, function () {
        browser.assert.element('.common-tags-list');
        browser.assert.text(`.common-tags-list .${collection} .${collection}-name`, new RegExp(`(?=.*${collection}1)`));
        browser.assert.text('.common-tags-list li:first-child .common-tagno', '3 tags');
        browser.assert.attribute(`.common-tags-list li:first-child .${collection}-link`, `href`, new RegExp(`^/${collection}/${dbData[collections][0].id}.*$`));

        let tagRegex = '';
        for(let tg of dbData[collections][0].tags.slice(1)) {
          tagRegex += `(?=.*${tg})`;
        }
        browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'title', new RegExp(tagRegex));
        browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'data-tooltip', new RegExp(tagRegex));
      });

      if(collection === 'project') {
        it('should show list of projects user is involved in (member/invited/joining)', function () {
          browser.assert.element('.involved-list');
          browser.assert.text('.involved-list .project .project-name', new RegExp('(?=.*project0)(?=.*project1)(?=.*project2)'));
          browser.assert.attribute(`.involved-list .project-link.project-id-${dbData.projects[0].id}`, 'href', new RegExp(`^/project/${dbData.projects[0].id}.*$`));
          browser.assert.text('.involved-list .project-involvement', new RegExp('(?=.*joining)(?=.*invited)(?=.*member)'));
        });
      }

    });
    context('not logged', function () {
      beforeEach(funcs.logout(browserObj));
      beforeEach(funcs.visit(`/${collection}s`, browserObj));

      it(`not show create-new-${collection} button`, function () {
        browser.assert.elements(`.create-new-${collection}`, 0);
      });
    });
  });
};
