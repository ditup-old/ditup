'use strict';

define(['jquery'], function ($) {

  function NewTalk(options) {
    this.dom = options.dom;
    this.dom.topic = this.dom.form.children('input[name="topic"]');
    this.dom.users = this.dom.form.children('input[name="user-list"]');
    this.dom.message = this.dom.form.children('textarea');

    this.submit = options.submit;

    var that = this;

    this.dom.form.on('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var data = {
        topic: that.dom.topic.val(),
        usernames: that.dom.users.val(),
        message: that.dom.message.val()
      };
      that.submit(data);
      return false;
    });
  }

  NewTalk.prototype.clear = function () {
    this.dom.form.children('input[type="text"],input[type="hidden"],textarea').val('');
    this.dom.userList.empty();


    //this.dom.form.children('textarea').val('');
  };

  NewTalk.prototype.toggle = function () {
    var that = this;
    this.dom.main.toggle({start: function () {
      that.clear();
    }});
  };
  
  return NewTalk;
});
