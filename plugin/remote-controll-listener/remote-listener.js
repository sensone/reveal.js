(function() {
  'use strict';

  var Reveal = window.Reveal
    , io = window.io
    , socket = io('http://localhost:3005')
    , ENABLE = 'enabled'
    , FRAGMENT = 'fragmented'
    , controls = document.querySelector('.controls')
    , ctrlLeft = controls.querySelector('.navigate-left')
    , ctrlRight = controls.querySelector('.navigate-right')
    , ctrlUp = controls.querySelector('.navigate-up')
    , ctrlDown = controls.querySelector('.navigate-down');


  function getElState(el) {
    var state;

    state = el.className.indexOf(ENABLE) >= 0 ? 'visible' : 'invisible';

    if (el.className.indexOf(FRAGMENT) >= 0) {
      state = 'both';
    }

    return state;
  }

  function getName() {
    var name = window.location.hash;

    return name.replace(/^#\//, '');
  }

  function getControllsState() {
    var state = {
      buttons: {
        left: getElState(ctrlLeft),
        right: getElState(ctrlRight),
        up: getElState(ctrlUp),
        down: getElState(ctrlDown)
      },
      name: getName(),
      notes: '<p> no notes </p>'
    }

    console.log(state);
    return state;
  }

  function send() {
    setTimeout(function() {
      var state = getControllsState();

      socket.emit('presentation:slidechanged', state);
    }, 0);
  };

  socket.on('connect', function (so) {
    console.log('connected!');

    Reveal.addEventListener( 'slidechanged', send );
    Reveal.addEventListener( 'fragmentshown', send );
    Reveal.addEventListener( 'fragmenthidden', send );
  });

  socket.on('disconnect', function () {
    console.log('disconnected!')
  });

  socket.on('presentation:left', function (data) {
    console.log('presentation:left!', JSON.stringify(data));
    Reveal.left();
  });

  socket.on('presentation:right', function (data) {
    console.log('presentation:right!', JSON.stringify(data));
    Reveal.right();
  });

  socket.on('presentation:up', function (data) {
    console.log('presentation:up!', JSON.stringify(data));
    Reveal.up();
  });

  socket.on('presentation:down', function (data) {
    console.log('presentation:down!', JSON.stringify(data));
    Reveal.down();
  });


})()
