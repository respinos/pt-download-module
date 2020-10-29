import NanoEvents from 'nanoevents';

// Find the right method, call on correct element
function launchFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

export var Expandinator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    var buttons = this.input.querySelectorAll('[data-target]');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.addEventListener('click', function(event) {
        var target = this.dataset.target;
        self.do(target);
      })
    }

    ['fullscreenchange', 'MSFullscreenChange' ].forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        var check = ( 
          document.webkitFullscreenElement || 
          document.msFullscreenElement || 
          document.fullscreenElement || 
          null );
        self.input.dataset.expanded = ( check != null );
      });
    })

  }

  do(target) {
    this.input.dataset.expanded = ( target == 'enter-fullscreen' );
    if ( target == 'enter-fullscreen' ) {
      launchFullscreen(document.documentElement);
    } else {
      exitFullscreen();
    }
  }
}
