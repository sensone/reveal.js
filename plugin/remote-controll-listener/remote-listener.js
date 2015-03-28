(function() {
  'use strict';

  var Reveal = window.Reveal
    , io = window.io
    , socket = io('http://localhost:3005')
    , ENABLE = 'enabled'
    , FRAGMENT = 'fragmented'
    , QRCode = window.QRCode
    , controls = document.querySelector('.controls')
    , ctrlLeft = controls.querySelector('.navigate-left')
    , ctrlRight = controls.querySelector('.navigate-right')
    , ctrlUp = controls.querySelector('.navigate-up')
    , mainPresentation
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

  function getNotes() {
    var slideElement = Reveal.getCurrentSlide()
      , notes = '<p> no notes </p>'
      , notesElement = slideElement.querySelector( 'aside.notes' );

    if(slideElement.hasAttribute('data-notes')) {
      notes = slideElement.getAttribute('data-notes');
    }

    if( notesElement ) {
      notes = notesElement.innerHTML;
    }

    return notes;
  }

  function getControllsState() {
    var state
      , revealState = Reveal.getState();

    state = {
      buttons: {
        left: getElState(ctrlLeft),
        right: getElState(ctrlRight),
        up: getElState(ctrlUp),
        down: getElState(ctrlDown)
      },
      name: getName(),
      notes: getNotes(),
      indexh: revealState.indexh,
      indexv: revealState.indexv,
      indexf: revealState.indexf
    }

    return state;
  }

  function send() {
    setTimeout(function() {
      var state = getControllsState();

      socket.emit('presentation:slidechanged', state);
    }, 0);
  };

  socket.on('connect', function () {
    console.log('connected!');
  });

  socket.on('presentation:createID', function(data) {
    var qrcode = new QRCode("qrcode", {
      text: data.link,
      width: 200,
      height: 200,
      colorDark : "#ffffff",
      colorLight : "#222222",
      correctLevel : QRCode.CorrectLevel.L
    });

    socket.emit('presentation:start', getControllsState());

    Reveal.addEventListener( 'slidechanged', send );
    Reveal.addEventListener( 'fragmentshown', send );
    Reveal.addEventListener( 'fragmenthidden', send );
  });

  socket.on('presentation:remoteConnected', function() {
    console.log('presentation:remoteConnected')
    document.querySelector('#qrcode').style.display = 'none';
  })

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

  socket.on('presentation:setState', function (data) {
    console.log('set state', data);

    if (mainPresentation || !Object.keys(data).length) return;

    Reveal.slide(data.indexh, data.indexv, data.indexf);
  });

  socket.on('remote:slidechanged', function(data) {

    Reveal.slide(data.indexh, data.indexv, data.xf);
  });




})()
