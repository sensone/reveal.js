(function() {
  'use strict';

  var Reveal = window.Reveal
    , io = window.io
    , socket = io('https://warm-coast-3384.herokuapp.com/')
    , ENABLE = 'enabled'
    , FRAGMENT = 'fragmented'
    , QRCode = window.QRCode
    , html2canvas = window.html2canvas
    , controls = document.querySelector('.controls')
    , ctrlLeft = controls.querySelector('.navigate-left')
    , ctrlRight = controls.querySelector('.navigate-right')
    , ctrlUp = controls.querySelector('.navigate-up')
    , mainPresentation
    , token
    , storage = window.localStorage
    , presentation_id = Reveal.getConfig().presentation_id
    , pointer = document.getElementById('pointer')
    , ctrlDown = controls.querySelector('.navigate-down');

  function showPointer(left, top) {
    var pointerStyle = pointer.style;

    pointerStyle.left = left + 'px';
    pointerStyle.top = top + 'px';
    pointerStyle.display = 'inline-block';

    setTimeout(function() {
      pointerStyle.display = 'none';
    }, 3000);
  }

  function zoomTo(left, top) {
    var zoomPadding = 20
      , revealScale = Reveal.getScale();

    event.preventDefault();

    zoom.to({
      x: left * revealScale - zoomPadding * 10,
      y: top * revealScale - zoomPadding * 10,
      width: revealScale + zoomPadding * 20,
      height: revealScale + zoomPadding * 20,
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

  function getToken() {
    return storage.getItem(presentation_id);
  }

  function setToken(token) {
    storage.setItem(presentation_id, token);
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
    var data = {
      presentation_id: presentation_id,
      state: getControllsState(),
      token: token
    };

    html2canvas(document.getElementsByTagName('body'), {
      onrendered: function(canvas) {
        data.state.screenshot = canvas.toDataURL();
        console.log('presentation:slidechanged', data)
        socket.emit('presentation:slidechanged', data);
      }
    });
  };

  socket.on('connect', function () {
    console.log('connected!');
    console.log(presentation_id)
    if (!presentation_id) {
      console.log('you don\'t set secret key in reveal config');
    } else {
      var data = {
        presentation_id: presentation_id,
        state: getControllsState(),
        token: getToken()
      };

      html2canvas(document.getElementsByTagName('body'), {
        onrendered: function(canvas) {
          data.state.screenshot = canvas.toDataURL();
          console.log(data)
          socket.emit('presentation:init', data);
        }
      });
    }
  });

  socket.on('server:init', function(data) {
    var qrSelector = 'qrcode';
    token = data.token;
    setToken(token);
    document.getElementById(qrSelector).innerHTML = '';

    new QRCode(qrSelector, {
      text: 'https://hidden-brushlands-5758.herokuapp.com/#/' + presentation_id + '/'+ token,
      width: 200,
      height: 200,
      colorDark : "#ffffff",
      colorLight : "#222222",
      correctLevel : QRCode.CorrectLevel.L
    });

    socket.emit('presentation:checkClient', {
      presentation_id: presentation_id,
      token: token
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

    showPointer(data.x, data.y);
  });

  socket.on('remote:zoom', function (data) {
    console.log('remote:zoom!', JSON.stringify(data));

    zoomTo(data.x, data.y);
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
