'use strict';

let data = {
  users: 8,
  tags: 15,
  challenges: 7,
  ideas: 6,
  projects: 9,
  discussions: 13
};

for(let collection of ['user', 'challenge', 'idea', 'project', 'discussion']) {
  data[`${collection}Tag`] = [];
  let collections = collection+'s';
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
}

module.exports = require('../partial/dbCreateData')(data);
