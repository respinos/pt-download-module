import NanoEvents from 'nanoevents';

export var Paginator = class {
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
    this.input.querySelector('#action-go-next').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.trigger.push('action-go-next');
      this.reader.next();
    })

    this.input.querySelector('#action-go-prev').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.trigger.push('action-go-prev');
      this.reader.prev();
    })

    this.input.querySelector('#action-go-first').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.trigger.push('action-go-first');
      this.reader.first();
    })

    this.input.querySelector('#action-go-last').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.trigger.push('action-go-last');
      this.reader.last();
    })

  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }
}
