import NanoEvents from 'nanoevents';

export var Rotator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.scale = parseInt(options.scale || 1.0, 10);
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
    this.input.counterclockwise = this.input.querySelector('#action-rotate-counterclockwise');
    this.input.counterclockwise.addEventListener('click', function(event) {
      self.emitter.emit('rotate', -90);
    })

    this.input.clockwise = this.input.querySelector('#action-rotate-clockwise');
    this.input.clockwise.addEventListener('click', function(event) {
      self.emitter.emit('rotate', 90);
    })

    this.reader.on('configure', function(config) {
      if ( config.rotate === false ) {
        this.input.counterclockwise.disabled = true;
        this.input.clockwise.disabled = true;
      } else {
        // var idx = this.possibles.indexOf(this.scale);
        this.input.counterclockwise.disabled = false;
        this.input.clockwise.disabled = false;
      }
    }.bind(this));
  }
}
