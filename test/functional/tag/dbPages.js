'use strict';

module.exports = function (collections) {
  let collection = collections.slice(0, -1);
  let upCollection = collection.capitalizeFirstLetter();

  let data = {};
  data.users = 20;
  data.tags = 10;
  data[collections] = 23;

  data.userTag = [];
  for(let i = 0; i < data.users; ++i) {
    for(let j = 0; j < data.tags; ++j) {
      let isMainTag = j === 0;
      let isMainToPopulate = isMainTag && i % 2 === 0;
      let isGeneralToPopulate = j !== 0 && j % (i||1) === 0;
      if(isMainToPopulate || isGeneralToPopulate) {
        data.userTag.push([i,j]);
      }
    }
  }

  data[`userFollow${upCollection}`] = [];
  for(let i = 0; i < data.users; ++i) {
    for(let j = 0; j < data[collections]; ++j) {
      if(i!==j && (i % (j+1) === 1 || j % (i+1) === 2))
        data[`userFollow${upCollection}`].push([i,j]);
    }
  }

  data[`${collection}Tag`] = [];
  for(let i = 0; i < data[collections]; ++i) {
    for(let j = 0; j < data.tags; ++j) {
      let isMainTag = j === 0;
      let isMainToPopulate = isMainTag && i % 2 === 0;
      let isGeneralToPopulate = j !== 0 && j % (i||1) === 0;
      if(isMainToPopulate || isGeneralToPopulate) {
        data[`${collection}Tag`].push([i,j]);
      }
    }
  }

  return require('../partial/dbCreateData')(data);
};
