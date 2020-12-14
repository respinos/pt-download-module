import NanoEvents from 'nanoevents';

// import _ from 'lodash';
// import array from 'lodash/array';
// import collection from 'lodash/collection';

// var _ = {};
// _.each = collection.each;
// _.indexOf = array.indexOf;
// _.union = array.union;
// _.difference = array.difference;

export var Searchinator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.reader = options.reader;
    this.input = options.input;

    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    self.setup();

    this.input.trigger = this.input.querySelector('[data-trigger="search"]');
    this.input.trigger.addEventListener('click', function(event) {
      // open the modal
      this.open();
    }.bind(this))

    this.form = this.panel.querySelector('form');
    this.alert = this.panel.querySelector('.alert');
    this.container = this.panel.querySelector('.results-container');

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this._submit({ term: this.form.querySelector('input[type="text"]').value, start: 1 });
    });

  }

  setup() {
    var panelHTML = `
    <div id="search-inside-modal" class="modal micromodal-slide" tabindex="-1" aria-hidden="true">
      <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="search-inside-modal-title">
          <div class="modal__header">
            <h2 id="search-inside-modal-title" class="modal__title">Search in this text</h2>
          </div>
          <div id="search-inside-modal-content" class="modal__content">
            <section id="search-inside-results-panel" class="section-container" style="overflow: auto">
              <div class="results-container">
                <div class="results-search-inside-form">
                  <h3 class="offscreen">Search in this volume</h3>
                  <form class="form-inline" method="get" id="form-search-inside-volume" role="search" action="/cgi/pt/search">
                    <label for="input-search-inside-text">Search in this text </label>
                    <input id="input-search-inside-text" name="q1" type="text" class="input-small" placeholder="" value="">
                    <button type="submit" class="btn dark">Find</button>
                    <input type="hidden" name="id" value="${this.reader.identifier}">
                    <input type="hidden" name="skin" value="default">
                    <input type="hidden" name="debug" value="${HT.params.debug}">
                  </form>
                </div>
                <div tabindex="-1" class="alert alert-info alert-block" aria-live="polite" aria-atomic="true" style="padding: 0.5rem; margin-top: 1rem"></div>
              </div>
            </section>
          </div>
          <div class="modal__footer">
            <button class="btn btn-dismiss" data-micromodal-close>Close</button>
          </div>
        </div>
      </div>
    </div>
    `;

    var body = new DOMParser().parseFromString(panelHTML, "text/html").body;
    while ( body.children.length ) {
      document.body.appendChild(body.children[0]);
    }

    this.panel = document.querySelector('#search-inside-modal section');

    if ( ! this._clickHandler ) {
      this._clickHandler = this.clickHandler.bind(this);
      this.panel.addEventListener('click', this._clickHandler);
    }
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.tagName.toLowerCase() == 'a' ) {
      event.preventDefault();
      event.stopPropagation();
      var seq = element.dataset.seq;
      this.reader.display(seq);
      this.close();
    }
  }

  render(slot, value) {
    // var span = this.output.querySelector(`[data-slot="${slot}"]`);
    // span.innerText = value;
  }

  open() {
    // using bootbox is a bit of a hack, but oh well...
    if ( ! this.modal ) {
      this.modal = bootbox.show('search-inside-modal');
    } else {
      bootbox.show(this.modal);
    }

    // this.modal = bootbox.dialog('search-inside-modal', 
    //   [
    //     {label: 'Close', class: 'btn-dismiss'}
    //   ], 
    //   { header: 'Page scans selected for download' }
    // );
  }

  close() {
    this.modal.closeModal();
  }

  _submit(params) {
    var self = this;

    var searchTerm = this.form.querySelector('input[type="text"]').value;
    var start = params.start;
    var url = `${window.location.pathname}/search?id=${this.reader.identifier};q1=${searchTerm};sz=25;start=${start}`;

    var button = this.form.querySelector('button');
    button.classList.add('btn-loading');

    // clear the form!
    self.alert.innerHTML = '<p>Submitting query for <em>' + searchTerm + '</em>...</p>';
    self.alert.focus();

    var articles = self.container.querySelectorAll('article');
    for(var i = 0; i < articles.length; i++) {
      self.container.removeChild(articles[i]);
    }
    var nav = self.container.querySelector('nav');
    if ( nav ) {
      self.container.removeChild(nav);
    }

    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    self.panel.scrollTop = 0;
    request.onload = function() {
      button.classList.remove('btn-loading');

      if (this.status >= 200 && this.status < 400) {
        // Success!

        var results = new DOMParser().parseFromString(this.response, "text/html").body;
        var articles = results.querySelectorAll('article.result');
        
        self.alert.innerHTML = results.querySelector('.alert').innerHTML;
        self.alert.focus();

        for(var i = 0; i < articles.length; i++) {
          self.container.appendChild(articles[i]);
        }
        nav = results.querySelector('nav.pagination-container');
        if ( nav ) {
          // console.log("AHOY", nav);
          // self.container.appendChild(nav);
          var mobileNav = document.createElement('nav');
          mobileNav.setAttribute('style', 'margin-top: 0.75rem; background-color: #f9f8f5; color: #565656; border-color: #666; padding: 0.5rem; text-align: center');
          // mobileNav.classList.add('pagination-container');
          // mobileNav.appendChild(nav.querySelector('.page-advance-link')); // this should change

          var mobileNavSpan = document.createElement('span');
          mobileNavSpan.setAttribute('style', 'white-space: nowrap');
          mobileNavSpan.innerHTML = `Page <input name="sz" type="number" value="${nav.dataset.currentPage}" size="5" min="1" max="${nav.dataset.totalPages}" style="width: 5rem; text-align: center" /> of ${nav.dataset.totalPages}`;
          mobileNav.appendChild(mobileNavSpan);
          // mobileNav.appendChild(nav.querySelector('.page-advance-link')); // what's left
          self.container.appendChild(mobileNav);
          var input = mobileNav.querySelector('input');
          input.addEventListener('change', (event) => {
            var value = input.value;
            self._submit({start: value});
          })
        }

      } else {
        console.log("AHOY PROBLEM", this)
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      self._data = null;
      console.log("AHOY REAL PROBLEM");
    };

    request.send();

  }

}
