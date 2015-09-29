'use strict';

define(['jquery'], function ($) {

  var TagSearch = function (data) {
    data.input
      .on('keyup', function (e) {
        e.preventDefault();
        console.log(data.input.val());
        //improve request optimisation (request sent with some mouseout, don't send empty request)
        $.ajax({
          url: '/ajax/search-tags',
          async: true,
          method: 'POST',
          data: {string: data.input.val()},
          dataType: 'json'
        })
          .then(function (response) {
            data.output.empty();
            for (var i=0, len=response.length; i<len; i++){
              //console.log(data);
              var output = data.process(response[i]);
              $(document.createElement('li')).append(output).appendTo(data.output);
            }
          });
      })
      //.on('blur', function (e) {
      //  data.output.css({display: 'none'});
      //})
      //.on('focus', function (e) {
      //  data.output.css({display: ''});
      //});
    //data.output.on('mouseout', function () {
    //  data.output.css({display: 'none'});
    //});
  };

  return TagSearch;
});
