'use strict';

define(['jquery'], function ($) {

  var Tag = function (data) {
    //data: tagData,
    //click: function () {
      //link to the tag page
    //},
    //close: function () {
      //remove tag of user from database
      //on success remove this tag from th
    //},
    //saved: false
    console.log(data);
    var data = data || {};
    if (data.data === undefined) throw new Error('you need to specify tag data');
    data.click = data.click || function () {
      console.log('empty click');
    };
    data.close = data.close === undefined ? null : data.close;
    var tagDom = '<a class="tag unsaved" ><i class="tag-close fa fa-times"></i></a>';
    this.name = data.data.name;
    this.dom = {};
    this.dom.main = $($.parseHTML(tagDom));
    this.dom.main.attr({href: '/tag/'+this.name});
    this.dom.close = this.dom.main.find('.tag-close');
    this.dom.main.prepend(document.createTextNode(this.name));
    if(data.close === null) {
      this.dom.close.remove();
    }
    else {
      var self = this;
      this.dom.close.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(self);
        data.close.call(self);
      });
    }
    this.dom.main.on('click', function () {
      data.click.call(self);
    });
    this.saved(data.saved);
  };

  Tag.prototype.saved = function (bSaved) {
    if(bSaved === true) {
      this.dom.main.removeClass('unsaved');
    }
    else if(bSaved === false) {
      this.dom.main.addClass('unsaved');
    }
  };

  Tag.prototype.del = function () {
    this.dom.main.remove();
  };

  return Tag;
});

