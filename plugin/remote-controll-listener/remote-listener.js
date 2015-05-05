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
    , token
    , storage = window.localStorage
    , presentation_id = Reveal.getConfig().presentation_id
    , ctrlDown = controls.querySelector('.navigate-down');

  var pointer = document.getElementById('pointer');

  function showPointer(left, top, bounds) {
    var pageW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var pageH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    pointer.style.left = pageW / bounds.width * left  + 'px';
    pointer.style.top = pageH / bounds.height * (top - bounds.top) + 'px';
    pointer.style.display = 'inline-block';

    setTimeout(function() {
      pointer.style.display = 'none';
    }, 3000);
  }

  function zoomTo(left, top, bounds) {
    var pageW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var pageH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var zoomPadding = 20;
    var revealScale = Reveal.getScale();

    event.preventDefault();

    zoom.to({
      x: ( pageW / bounds.width * left * revealScale ) - zoomPadding,
      y: ( pageH / bounds.height * (top - bounds.top) * revealScale ) - zoomPadding,
      width: ( bounds.width * revealScale ) + ( zoomPadding * 2 ),
      height: ( bounds.height * revealScale ) + ( zoomPadding * 2 ),
      pan: false
    });
  }

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

  function getSecretKey() {
    return storage.getItem('riveal_secret_key');
  }

  function setSecretKey(key) {
    storage.setItem('riveal_secret_key', key);
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
      var data = {
          presentation_id: presentation_id,
          state: getControllsState(),
          token: token
        };

      socket.emit('presentation:slidechanged', data);
    }, 0);
  };

  socket.on('connect', function () {
    console.log('connected!');
    console.log(presentation_id)
    if (!presentation_id) {
      console.log('you don\'t set secret key in reveal config');
    } else {
      console.log(getControllsState())
      socket.emit('presentation:init', {
        presentation_id: presentation_id,
        state: getControllsState()
      });
    }
  });

  socket.on('server:init', function(data) {
    token = data.token;

    var qrcode = new QRCode("qrcode", {
      text: 'http://localhost:3006/' + presentation_id + '/'+ token,
      width: 200,
      height: 200,
      colorDark : "#ffffff",
      colorLight : "#222222",
      correctLevel : QRCode.CorrectLevel.L
    });

    //socket.emit('presentation:start', getControllsState());

    Reveal.addEventListener( 'slidechanged', send );
    Reveal.addEventListener( 'fragmentshown', send );
    Reveal.addEventListener( 'fragmenthidden', send );
  });

  socket.on('remote:remoteConnected', function() {
    console.log('remote:remoteConnected')
    document.querySelector('#qrcode').style.display = 'none';
  })

  socket.on('disconnect', function () {
    console.log('disconnected!')
  });

  socket.on('remote:left', function (data) {
    console.log('remote:left!', JSON.stringify(data));
    Reveal.left();
  });

  socket.on('remote:right', function (data) {
    console.log('remote:right!', JSON.stringify(data));
    Reveal.right();
  });

  socket.on('remote:up', function (data) {
    console.log('remote:up!', JSON.stringify(data));
    Reveal.up();
  });

  socket.on('remote:pointer', function (data) {
    console.log('remote:pointer!', JSON.stringify(data));

    showPointer(data.x, data.y, data.bounds);
  });

  socket.on('remote:zoom', function (data) {
    console.log('remote:zoom!', JSON.stringify(data));

    zoomTo(data.x, data.y, data.bounds);
  });

  socket.on('remote:down', function (data) {
    console.log('remote:down!', JSON.stringify(data));
    Reveal.down();
  });

  socket.on('remote:setState', function (data) {
    console.log('set state', data);

    if (mainPresentation || !Object.keys(data).length) return;

    Reveal.slide(data.indexh, data.indexv, data.indexf);
  });

  socket.on('presentation:slidechanged', function(data) {

    Reveal.slide(data.indexh, data.indexv, data.xf);
  });




})()
