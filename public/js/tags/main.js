'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js/tags/',
  paths: {
    jquery: '/libs/js/jquery'
  }
});

require(['TagSearch', 'TagSearchItem', 'jquery'], function (TagSearch, TagSearchItem, $) {
  //DOM elements
  var $tagSearch = $('#tag-search');
  var $tagSearchInput = $('#tag-search-input');
  var $tagSearchOutput = $('#tag-search-output');
  var $tagList = $('#tag-list');
  //variables

  var tagBox = new TagSearch({
    input: $tagSearchInput,
    output: $tagSearchOutput,
    process: function (tagData) {
      var item = new TagSearchItem({
        tag2: 'asdf',
        tag: tagData,
        action: function (data) {
          //show unsaved tag in the list
          console.log('clicked tag');
          var tag = new Tag({
            data: tagData,
            click: function () {
              //link to the tag page
            },
            close: function () {
              //remove tag of user from database
              //on success remove this tag from th
            },
            saved: false
          });

          //save tag to list of user tags
          //change unsaved tag to saved tag on success
          var tagListItem = $(document.createElement('li')).append(tag.dom.main);
          tagListItem.appendTo($tagList);
        },
        asdf: function () {}
      });
      return item.dom.main;
    }
  });
});
