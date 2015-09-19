'use strict';

define(['jquery'], function($){
  
  var User = function (data) {
    this.color = data.color || 'grey';
    this.dom = {};
    this.dom.main = $(document.createElement('span'))
      .css({'margin':'3px', 'background-color': this.color}); //online?
    var $online = $(document.createElement('span')).text('o').appendTo(this.dom.main).css({color: 'green'});
    $(document.createElement('span')).text(data.user.username).appendTo(this.dom.main);
    return this;
  }

  User.prototype.addTo = function (dom) {
    this.dom.main.appendTo(dom);
    return this;
  };

  var Message = function (data) {
    this.dom = {};

    var msg = data.message;
    var date = new Date(msg.sent);
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var sent = ''+date.getHours()+':'+(minutes<10?'0':'')+minutes+':'+(seconds<10?'0':'')+seconds;
    this.dom.main = $(document.createElement('div'))
      .css({'background-color': data.color || 'grey', 'margin': '5px'});
    $(document.createElement('span'))
      .css({'font-weight': 'bold'})
      .text(msg.from.username)
      .appendTo(this.dom.main);
    
    $(document.createElement('span'))
      .css({})
      .text(' ['+sent+']: ')
      .appendTo(this.dom.main);
    $(document.createElement('span'))
      .text(msg.text)
      .appendTo(this.dom.main);
    
  }

  Message.prototype.addTo = function (dom) {
    this.dom.main.appendTo(dom);
  };

  var Talk = function (data) {
  //this is the talk object... for the place where actual conversation is taking place
    this.dom={};
    this.dom.chat = data.dom.chat;
    //empty the chat
    this.dom.chat.empty();
    this.dom.participants = {
      users: $(document.createElement('div')).appendTo(this.dom.chat)
    }
    this.url = data.talk.url;

    this.participants = {
      users: {},
      dits: {},
      colorBase: Math.random(),
      colorNumber: 0
    };

    var talk = data.talk;
    //*******show chat participants
    var users = talk.participants.users;
    for(var i=0, len=users.length; i<len; i++) {
      this.addUser(users[i]);
    }
    
    //show past messages
    var msgs = talk.messages;
    for(var i=0, len=msgs.length; i<len; i++) {
      var msg = msgs[i];
      this.addMessage(msg);
    }

    return this;
  };

  Talk.prototype.makeColor = function () {
    //******* http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
    var phi = 0.618033988749895;
    var h = (this.participants.colorBase + phi*this.participants.colorNumber)%1;
    this.participants.colorNumber++;
    return hsvToRgb(h, 0.2, 0.95);
  };

  Talk.prototype.addUser = function (usr) {
    var user = new User({
      user: usr,
      color: this.makeColor()
    });
    this.participants.users[usr.username]=user;
    user.addTo(this.dom.participants.users);
  };

  Talk.prototype.addMessage = function (msg) {
    var message = new Message({message: msg, color: this.participants.users[msg.from.username].color});
    message.addTo(this.dom.chat);
  };

  function generateRandomColor(mix) {
    var mix = mix || [255, 255, 255];
    var r = getRandomInt(0, 255);
    var g = getRandomInt(0, 255);
    var b = getRandomInt(0, 255);

  // mix the color
    r = Math.floor((r + mix[0]) / 2);
    g = Math.floor((g + mix[1]) / 2);
    b = Math.floor((b + mix[2]) / 2);
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    r = r.length==1 ? '0'+r : r;
    g = g.length==1 ? '0'+g : g;
    b = b.length==1 ? '0'+b : b;
    console.log('color',r,g,b);
    return '#'+r+g+b;
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function hsvToRgb(h, s, v) {
    //******* http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
    //******* https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
    var c = v*s;
    var h_i = h*6;
    var x = c*(1-Math.abs((h_i%2)-1));
    var m = v - c;

    var rgbi;
    if (h_i >=0 && h_i < 1)     rgbi = [c, x, 0];
    else if (h_i >=1 && h_i <2) rgbi = [x, c, 0];
    else if (h_i >=2 && h_i <3) rgbi = [0, c, x];
    else if (h_i >=3 && h_i <4) rgbi = [0, x, c];
    else if (h_i >=4 && h_i <5) rgbi = [x, 0, c];
    else if (h_i >=5 && h_i <6) rgbi = [c, 0, x];

    var rgb = [
      Math.floor((rgbi[0]+m)*256),
      Math.floor((rgbi[1]+m)*256),
      Math.floor((rgbi[2]+m)*256)
    ];

    var r = rgb[0].toString(16);
    var g = rgb[1].toString(16);
    var b = rgb[2].toString(16);
    r = r.length==1 ? '0'+r : r;
    g = g.length==1 ? '0'+g : g;
    b = b.length==1 ? '0'+b : b;
    console.log('color',r,g,b);
    return '#'+r+g+b;
  }

  return Talk;
});
