'use strict';

define(['jquery'], function ($) {

  var User = function (data) {
    //data: userData,
    //click: function () {
      //link to the user page
    //},
    //close: function () {
      //remove tag of user from database
      //on success remove this tag from th
    //},
    //saved: false
    console.log(data);
    var data = data || {};
    if (data.user === undefined) throw new Error('you need to specify tag data');
    data.click = data.click || function () {
      console.log('empty click');
    };
    data.close = data.close === undefined ? null : data.close;
    var userDom = '<span class="avatar" ><a ><span class="span-image avatar-image" style="background-image:url(\'/user/' + data.user.username + '/avatar\')" ></span><span class="avatar-username" ></span><i class="avatar-close fa fa-times"></i></a></span>'
    this.user = {username: data.user.username};
    this.dom = {};
    this.dom.main = $($.parseHTML(userDom));
    this.dom.link = this.dom.main.find('a');
    this.dom.link.attr({href: '/user/'+this.user.username});
    this.dom.close = this.dom.main.find('.avatar-close');
    this.dom.username = this.dom.main.find('.avatar-username');
    this.dom.username.append(document.createTextNode('@'+this.user.username));
    if(data.close === null) {
      this.dom.close.remove();
    }
    else {
      var that = this;
      this.dom.close.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(that);
        data.close.call(that);
      });
    }
    this.dom.main.on('click', function () {
      data.click.call(that);
    });
  };

  User.prototype.remove = function () {
    this.dom.main.remove();
  };

  return User;
});
