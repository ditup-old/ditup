define(['jquery'], function ($) {
  /** do we need this? What for?*/
  var Avatar = function (data) {
    /** data = {user: {username: "", ..}}
      *
      *
      */
    this.dom = {};

    this.dom.main = $(document.createElement('div'))
      .css({height: '20px', 'background-color': 'gray'});

    this.username = data.user.username;

    return this;
  };

  Avatar.prototype.addTo = function (dom) {
    this.dom.main.appendTo(dom);
    return this;
  };

  return Avatar;
});
