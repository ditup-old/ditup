'use strict';

let create = require('../partial/dbCreateData');

module.exports = function (collectionName) {
  let collection = collectionName;
  let dataObject = {users: 7, tags: 6};
  dataObject[`${collectionName}s`] = 9;
  dataObject[`userFollow${collectionName.substr(0,1).toUpperCase()}${collectionName.substr(1)}`] = [
    [0,3],
    [1,3],
    [2,3],
    [3,3],
    [4,3],
    [0,5],
    [1,5],
    [2,5],
    [3,5],
    [0,4],
    [1,4],
    [2,4],
    [0,6],
    [1,6],
    [1,7],
  ];

  dataObject.userTag = [
    [0, 0],
    [0, 2],
    [0, 4],
    [0, 5],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [3, 1],
    [3, 5]
  ];
  dataObject[`${collection}Tag`] = [
    [0,0],
    [0,1],
    [0,2],
    [0,3],
    [1,1],
    [1,3],
    [2,2],
    [2,5]
  ];

  if(collection === 'project') {
    dataObject.projectMember = [
      [0, 1, 'joining'],
      [0, 2, 'invited'],
      [0, 3, 'member'],
      [0, 4, 'member'],
      [1, 1, 'member'],
      [1, 2, 'invited'],
      [1, 3, 'joining'],
      [1, 4, 'member'],
      [2, 1, 'invited']
    ];
  }

  return create(dataObject);
}
