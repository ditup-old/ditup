'use strict';

define(['jquery'], function ($) {

  var Talk = function (talk, data) {
    this.dom = {};
    this.url = talk.url;
    this.date = talk.lastMessage.sent;

    var socket = data.socket;

    var msg = talk.lastMessage||talk.messages[talk.messages.length-1];
    console.log(talk);
    var talkLink = $(document.createElement('a'));
    var talkDiv = $(document.createElement('div')).appendTo(talkLink)
      .css({'background-color': talk.viewed===true?'yellow':'blue'});
    talkLink
      .attr({'href':''})
      .on('click', (function (e) {
        e.preventDefault();
        console.log('start talk', this.url);
        socket.emit('start talk', {url: this.url});
        return false;
      }).bind(this));
    $(document.createElement('span')).css({}).text(msg.sent).appendTo(talkDiv);
    $(document.createElement('span')).css({'font-weight': 'bold'}).text(msg.from.username).appendTo(talkDiv);
    $(document.createElement('span')).text(msg.text).appendTo(talkDiv);
    this.dom.main = talkLink;
    return this;
  };

  Talk.prototype.del = function () {
    if(this.dom) {
      this.dom.main.remove();
      delete this.dom;
    }
    else {console.log('err:dom already deleted');}
  };

  

  var TalkList = function (data) {
    this.talks = [];
    this.dom = {};
    this.socket = data.socket;
    this.dom.list = data.dom.list;
  };

  TalkList.prototype.listTalks = function (talks) {
    //clear list
    this.clear();
    //fill list with the given talks
    for(var i=0, len=talks.length; i<len; i++) {
      this.addTalk(talks[i]);
    }
  };
  
  TalkList.prototype.addTalk = function (talk) {
    //check if talk is already there. if yes, remove
    this.removeTalk({url: talk.url});
    //add talk to top of the list
    var tk = new Talk(talk, {socket: this.socket});
    console.log(this.dom.list);
    tk.dom.main.prependTo(this.dom.list);
    this.talks.push(tk);
  };

  TalkList.prototype.contains = function (url) {
    /**
     * this function should tell if TalkList contains talk with given url
     * returns the Talk or false (if not exist);
     *
     **/
    for(var i=0, len=this.talks.length; i<len; i++) {
      if(url === this.talks[i].url) return i;
    }

    return -1;
  };

  TalkList.prototype.removeTalk = function (data) {
    //data = {url} 
    var contains = this.contains(data.url);
    while(contains > -1){
      this.talks[contains].del();
      this.talks.splice(contains, 1);
      contains = this.contains(data.url);
    }
  };

  TalkList.prototype.sort = function () {
    this.talks.sort(function (a, b) {
      var a1 = new Date(a.date);
      var b1 = new Date(b.date);
      console.log(a1.constructor.name, b1.constructor.name);
      return (a1>b1)-(a1<b1);
    });
    for(var i=0, len=this.talks.length; i<len; i++) {
      this.dom.list.prepend(this.talks[i].dom.main);
    }
  };

  TalkList.prototype.clear = function () {
    for (var i=0, len=this.talks.length; i<len; i++) {
      //remove each talk
      this.talks[i].del();
      this.talks=[];
    }
  };

  return TalkList;
});
