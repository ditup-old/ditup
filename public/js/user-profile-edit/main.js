'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js',
  paths: {
    jquery: '/libs/js/jquery',
    jqueryui: '/libs/jquery-ui-1.11.4/jquery-ui',
    'jquery-private': '/libs/js/jquery-private'
  },
  map: {
    // '*' means all modules will get 'jquery-private'
    // for their 'jquery' dependency.
    '*': { 'jquery': 'jquery-private' },
    '*': { '$': 'jquery-private' },
    '*': { 'jQuery': 'jquery-private' },

    // 'jquery-private' wants the real jQuery module
    // though. If this line was not here, there would
    // be an unresolvable cyclic dependency.
    'jquery-private': { 'jquery': 'jquery' }
  }
});

require(['tags/Tag', 'jquery', 'jqueryui'], function (Tag, $) {
  //DOM elements
  var $tagList = $('#tag-list');
  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);
  var username = urlPath[1];

  var source = function (request, response) {
    $.ajax({
      url: '/ajax/search-tags',
      async: true,
      method: 'POST',
      data: {string: request.term},
      dataType: 'json'
    })
    .then(function (data){
      var tags = [];
      for (var i = 0, len = data.length; i<len; i++) {
        var name = data[i].name;
        tags.push({value: name, label: name});
      }
      return response(tags);
      //return response(data);
    });
  };

  $('#autocomplete').autocomplete({
    source: source,
    appendTo: '#add-tag',
    delay: 600,
    minLength: 3,
    select: function (e, ui) {
      addTag(ui.item.value);
      return false;
    }
  });

  function addTag(name) {
    //show unsaved tag in the list
    console.log('clicked tag');
    var tag = new Tag({
      data: {name: name},
      click: tagFunctions.click.call(tag, {name: name}),
      close: tagFunctions.close.call(tag, {name: name}),
      saved: false
    });

    //save tag to list of user tags
    $.ajax({
      url: '/ajax/add-tag',
      async: true,
      method: 'POST',
      data: {name: name},
      dataType: 'json'
    })
    .then(function (resp){
      console.log('******************', JSON.stringify(resp));
      if(resp.hasOwnProperty('success') && resp.success === true) {
        //change unsaved tag to saved tag on success
        tag.saved(true);
      }
      else tag.del();
    });
    var tagListItem = $(document.createElement('li')).append(tag.dom.main);
    tagListItem.appendTo($tagList);
  }

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
          data: {name: tagData.name},
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
    url: '/ajax/read-tags-of-user',
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

});
