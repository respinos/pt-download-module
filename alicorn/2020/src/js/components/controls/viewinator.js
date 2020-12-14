import NanoEvents from 'nanoevents';

export var Viewinator = class {
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
        var pressed;
        if ( pressed = self.input.querySelector('[aria-pressed="true"]') ) {
          pressed.removeAttribute('aria-pressed');
        }
        this.setAttribute('aria-pressed', 'true');
        self.reader.restart({ view: target, clicked: event.detail == 1 });
      })
    }

    if ( ! this.reader.service.hasOcr ) {
      var button = this.input.querySelector('[data-target="plaintext"]');
      button.disabled = true;
    }

    if ( ! ( this.reader.service.manifest.totalSeq > 1 ) ) {
      var button = this.input.querySelector('[data-target="2up"]');
      button.disabled = true;
      button.dataset.disabled = true;
      button = this.input.querySelector('[data-target="thumb"]');
      if ( button ) {
        button.disabled = true;
      }
    }

  }

}
