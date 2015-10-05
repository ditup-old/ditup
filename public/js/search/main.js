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
  var $tagList = $('#tagnames');
  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);
  var username = urlPath[1];

  var source = function (request, response) {
    $.ajax({
      url: '/search-tags',
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
  
  var $tagInput = $('#autocomplete-tag');
  var $hiddenTagList = $('#hidden-tag-list');
  $tagInput.attr({name: '', placeholder: 'search tag'});
  $hiddenTagList.attr({name: 'tagnames'});

  var selectedTags = [];

  $tagInput.autocomplete({
    source: source,
    //appendTo: '#add-tag',
    delay: 600,
    minLength: 3,
    select: function (e, ui) {
      if(selectedTags.indexOf(ui.item.value) !== -1) return false;
      selectedTags.push(ui.item.value);
      $hiddenTagList.val(selectedTags.join(', '));
      addTag(ui.item.value);
      $tagInput.val('');
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
      saved: true
    });

    tag.dom.main.appendTo($tagList);
  }

  var tagFunctions = {
    click: function (tagData) {
      //link to the tag page
      return function () {};
    },
    close: function (tagData) {
      return function () {
        var self = this;

        var index = selectedTags.indexOf(tagData.name);
        if (index > -1) {
          selectedTags.splice(index, 1);
        }
        $hiddenTagList.val(selectedTags.join(', '));
        //remove this tag from th
        self.del();
      };
    }
  };

});
