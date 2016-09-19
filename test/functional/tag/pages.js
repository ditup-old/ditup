'use strict';

module.exports = function (collectionName) {
  let collections = collectionName;
  let collection = collectionName.slice(0, -1);
  let upCollections = `${collectionName.slice(0,1).toUpperCase()}${collectionName.slice(1)}`;
  let upCollection = upCollections.slice(0, -1);

  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require(`./db${upCollections}`);

  let deps = config.init({db: dbConfig}, dbData);
  let funcs = config.funcs;


  describe(`/tag/:tagname/${collections}`, function () {
    // ********** preparation
    let browserObj = {};
    let browser;

    config.beforeTest(browserObj, deps);

    beforeEach(function () {
      browser = browserObj.Value;
    });
    // ***********end of preparation
    //
    //
    let loggedUser = dbData[collections][0];
    let existentTag = dbData.tags[0];

    beforeEach(funcs.visit(`/tag/${existentTag.tagname}/${collections}`, browserObj));

    it(`should show the tag-${collections} page`, function () {
      //browser.assert.text(`.tag-${collections}-header`, `${upCollections}`);
      browser.assert.element(`.tag-${collections}`);
    });
    it(`should list the ${collections}`, function () {
      browser.assert.elements(`.tag-${collection}`, Math.ceil(dbData[collections].length / 2));
    });
    it(`should show other tags of each ${collection}`, function () {
      browser.assert.elements(`.tag-${collection}-tags-list`, Math.ceil(dbData[collections].length/2));
    });
  });

}

