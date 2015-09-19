'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js',
  paths: {
    jquery: '/libs/js/jquery'
  }
});

require(['tags/TagSearch', 'tags/TagSearchItem', 'tags/Tag', 'jquery'], function (TagSearch, TagSearchItem, Tag, $) {
  //DOM elements
  //var $tagSearch = $('#tag-search');
  var $tagSearchInput = $('#tag-search-input');
  var $tagSearchOutput = $('#tag-search-output');
  var $tagList = $('#tag-list');
  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);
  var username = urlPath[1];

  var tagFunctions = {
    click: function (tagData) {
      //link to the tag page
      return function () {};
    },
    close: function (tagData) {
      return function () {
        var self = this;
        console.log(tagData.name);
        //remove tag of user from database
        $.ajax({
          url: '/ajax/remove-tag',
          async: true,
          method: 'POST',
          data: {tagname: tagData.name},
          dataType: 'json'
        })
        .then(function (resp){
          console.log(JSON.stringify(resp));
          if(resp.hasOwnProperty('success') && resp.success === true) {
            console.log(self);
            self.del();
          }
          else if(resp.hasOwnProperty('success') && resp.success === false) {
          }
        });
        //on success remove this tag from th
      };
    }
  };

  //show tags
  $.ajax({
    url: '/ajax/get-tags',
    async: true,
    method: 'POST',
    data: {username: username}, //just for testing purposes! how to get username?
    dataType: 'json'
  })
  .then(function (resp){
    $tagList.empty();
    console.log(JSON.stringify(resp));
    for(var i=0, len=resp.length; i<len; i++){
      var tag = new Tag({
        data: resp[i],
        click: tagFunctions.click(resp[i]),
        close: tagFunctions.close(resp[i]),
        saved: true
      });

      var tagListItem = $(document.createElement('li')).append(tag.dom.main);
      tagListItem.appendTo($tagList);
    }
  });

  var tagTemplate = '<span></span>';

  var tagBox = new TagSearch({
    input: $tagSearchInput,
    output: $tagSearchOutput,
    process: function (tagData) {
      var item = new TagSearchItem({
        tag: tagData,
        action: function (data) {
          //show unsaved tag in the list
          console.log('clicked tag');
          var tag = new Tag({
            data: tagData,
            click: tagFunctions.click.call(tag, tagData),
            close: tagFunctions.close.call(tag, tagData),
            saved: false
          });

          //save tag to list of user tags
          $.ajax({
            url: '/ajax/add-tag',
            async: true,
            method: 'POST',
            data: {tagname: tagData.name},
            dataType: 'json'
          })
          .then(function (resp){
            console.log(JSON.stringify(resp));
            if(resp.hasOwnProperty('success') && resp.success === true) {
              tag.saved(true);
            }
            else if(resp.hasOwnProperty('success') && resp.success === false) {
              tag.del();
            }
          });
          //change unsaved tag to saved tag on success
          var tagListItem = $(document.createElement('li')).append(tag.dom.main);
          tagListItem.appendTo($tagList);
        },
      });
      console.log(item);
      return item.dom.main;
    }
  });
});
