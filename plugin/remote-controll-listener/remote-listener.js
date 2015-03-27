(function() {
  'use strict';

  var Reveal = window.Reveal
    , io = window.io
    , socket = io('http://localhost:3005');

  socket.on('connect', function (so) {
    console.log('connected!');
    console.log(so)
  });

  socket.on('disconnect', function () {
    console.log('disconnected!')
  });

  socket.on('presentation:left', function (data) {
    console.log('presentation:left!');
    console.log(JSON.stringify(data));
    Reveal.left();
  });

  socket.on('presentation:right', function (data) {
    console.log('presentation:right!');
    console.log(JSON.stringify(data));
    Reveal.right();
  });

  socket.on('presentation:up', function (data) {
    console.log('presentation:up!');
    console.log(JSON.stringify(data));
    Reveal.up();
  });

  socket.on('presentation:down', function (data) {
    console.log('presentation:down!');
    console.log(JSON.stringify(data));
    Reveal.down();
  });

})()
