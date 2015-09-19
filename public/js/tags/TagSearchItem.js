'use strict';

define(['jquery'], function ($) {

  var TagSearchItem = function (data) {
    //var data = data;// || {};
    console.log(data);
    data.action = data.action;// || function () {
//      console.log('clicked', data.tag.name);
//    };
    this.dom = {};
    var dom = $(document.createElement('a'))
      .append(document.createTextNode(data.tag.name));
    this.dom.main = dom;
    
    dom.on('click', function (e) {
      console.log('item mouseuped');
      //e.preventDefault();
      //e.stopPropagation();
      data.action();
    });
    //console.log(dom);

    //this.dom.main.on('click', function (e) {
    //  e.preventDefault();
    //  data.action();
    //});
    return this;
  };

  return TagSearchItem;
});
