import NanoEvents from 'nanoevents';

export var Zoominator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.scale = parseInt(options.scale || 1.0, 10);
    this.input = options.input;
    this.reader = options.reader;
    // this._possibles = [ 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    this._possibles = [ 0.5, 0.7, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 3.0, 4.0 ];
    // this.possibles = [ 0.75, 1.0, 1.25, 1.5 ];
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  get possibles() {
    // if ( this.reader && this.reader.view && this.reader.view.possibles ) {
    //   return this.reader.view.possibles;
    // }
    return this._possibles;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    this.reader.on('ready', () => {
      self._initialized = true;
    });

    document.addEventListener('click', function(event) {
      var target = event.target.closest('button');
      if ( ! target ) { return; }
      if ( target.classList.contains('action-zoom-in') ) {
        var idx = self.possibles.indexOf(self.scale);
        idx += 1;
        self.update(idx);
      } else if ( target.classList.contains('action-zoom-out') ) {
        var idx = self.possibles.indexOf(self.scale);
        idx -= 1;
        self.update(idx);
      } else if ( target.classList.contains('action-zoom-reset') ) {
        // self.update(-1);
        var idx = self.possibles.indexOf(1);
        self.update(idx);
      }
    })
  }

  update(idx) {
    if ( ! this._initialized ) { return; }
    this.scale = this.possibles[idx];
    this.enable(document.querySelectorAll('.action-zoom-in'), ! ( idx == ( this.possibles.length - 1 )))
    this.enable(document.querySelectorAll('.action-zoom-out'), ! ( idx == 0 ))

    this.reader.emit('redraw', { scale: this.scale });
  }

  disable(elements) {
    elements.forEach((element) => {
      element.disabled = true;
    })
  }

  enable(elements, state) {
    elements.forEach((element) => {
      element.disabled = ! state;
    })
  }

}