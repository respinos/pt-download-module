import NanoEvents from 'nanoevents';

export var Contentsnator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new NanoEvents();

    this.datalist = this.input.querySelector('ul.dropdown-menu');
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.input.querySelector('button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    })

    this.datalist.addEventListener('click', (event) => {
      var target = event.target;
      if ( target.hasAttribute('href') ) {
        this.modal.closeModal();
        event.preventDefault();
        event.stopPropagation();
        var seq = target.dataset.seq;
        this.reader.display(seq);
      }
    })

    // this.reader.on('relocated', (params) => {
    //   this.render('current-seq', params.seq);
    //   this.input.value = params.seq;
    // })
  }

  open() {
    // using bootbox is a bit of a hack, but oh well...
    this.modal = bootbox.dialog(this.datalist, 
      [
        {label: 'Close', class: 'btn-dismiss'}
      ], 
      { header: 'Contents' }
    );
  }
}
