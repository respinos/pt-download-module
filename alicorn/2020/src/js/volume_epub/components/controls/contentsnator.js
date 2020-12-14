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
    var self = this;

    var lis = this.datalist.querySelectorAll('li');
    for(var i = 0; i < lis.length; i++) {
      this.datalist.removeChild(lis[i]);
    }

    this.input.querySelector('button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    })

    this.reader.on('initialized', () => {
      this.reader.view.on('updateContents', (data) => {
        var _process = function(items, tabindex, parent) {
          items.forEach(function(item) {
            var option = self._createOption(item, tabindex, parent);
            if ( item.subitems && item.subitems.length ) {
              _process(item.subitems, tabindex + 1, option);
            }
          })
        };
        _process(data.toc, 0, self.datalist);
      })
    })

    this.datalist.addEventListener('click', (event) => {
      var target = event.target.closest('a');
      if ( target && target.hasAttribute('href') ) {
        this.modal.closeModal();
        event.preventDefault();
        event.stopPropagation();
        var href = target.getAttribute('href');
        this.reader.display(href);
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

  _createOption(chapter, tabindex, parent) {

    function pad(value, length) {
        return (value.toString().length < length) ? pad("-"+value, length):value;
    }

    function create(tagName, cls, parent) {
      var node = document.createElement(tagName);
      if ( cls ) {
        // do something
      }
      if ( parent ) {
        parent.appendChild(node);
      }
      return node;
    }

    var option = create('li');
    if ( chapter.href ) {
      var anchor = create('a', null, option);
      if ( chapter.html ) {
        anchor.innerHTML = chapter.html;
      } else {
        anchor.textContent = chapter.label;
      }
      // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
      // option.textContent = tab + chapter.label;
      anchor.setAttribute('href', chapter.href);
      anchor.setAttribute('data-href', chapter.href);
    } else {
      var span = create('span', null, option);
      span.textContent = chapter.label;
    }

    if ( parent.tagName === 'LI' ) {
      // need to nest
      var tmp = parent.querySelector('ul');
      if ( ! tmp ) {
        tmp = create('ul', null, parent);
      }
      parent = tmp;
    }

    parent.appendChild(option);
    return option;
  }
}
