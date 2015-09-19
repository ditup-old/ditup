'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js',
  paths: {
    jquery: '/libs/js/jquery'
  }
});

require(['tags/Tag', 'jquery'], function (Tag, $) {
  //DOM elements
  var $tagList = $('#tag-list');
  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);
  var url = urlPath[1];

  var tagFunctions = {
    click: function (tagData) {
      //link to the tag page
      return function () {};
    },
    close: function (tagData) {
      return null;
    }
  };

  //asynchronously loading and showing tags
  $.ajax({
    url: '/ajax/dit/get-tags',
    async: true,
    method: 'POST',
    data: {url: url}, //just for testing purposes! how to get username?
    dataType: 'json'
  })
  .then(function (resp){
    $tagList.empty();
    console.log(JSON.stringify(resp));
    if(resp.length === 0) {
      $($.parseHTML('<li><span class="tag unsaved">dit '+url+' has no tags</span></li>')).appendTo($tagList);
    }
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
});
