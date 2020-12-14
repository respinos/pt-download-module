import NanoEvents from 'nanoevents';

// import _ from 'lodash';
// import array from 'lodash/array';
// import collection from 'lodash/collection';

// var _ = {};
// _.each = collection.each;
// _.indexOf = array.indexOf;
// _.union = array.union;
// _.difference = array.difference;


var checkboxEmptySvg = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
</svg>`;
var checkboxCheckedSvg = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-check-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
  <path fill-rule="evenodd" d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.236.236 0 0 1 .02-.022z"/>
</svg>`;


export var Selectinator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.reader = options.reader;
    this.input = options.input;
    this.datalist = this.input.querySelector('ul');
    // this.datalist = this.input.querySelector('ul.dropdown-menu');

    this.link = options.link;
    this.reset = options.reset;
    this.emitter = new NanoEvents();
    this._selection = {};
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    this.reader.on('ready', () => {
      self.setup();
    });
    
    this.reset.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      this._clearSelection();
    }.bind(this));

    // this.input.querySelector('button').addEventListener('click', (event) => {
    //   event.preventDefault();
    //   event.stopPropagation();
    //   this.open();
    // });

    this.datalist.addEventListener('click', (event) => {
      var target = event.target;
      target = target.closest('a');
      if ( target && target.hasAttribute('href') ) {
        // this.modal.closeModal();
        event.preventDefault();
        event.stopPropagation();
        var seq = target.dataset.seq;
        this.reader.display(seq);
      }
    })

  }

  setup() {
    if ( ! this._clickHandler ) {
      this._clickHandler = this.clickHandler.bind(this);
      this.reader.view.container.addEventListener('click', this._clickHandler);
    }

    var printable = this._getPageSelection();
    this._updateSelectionLabel(printable.length);
    this._updateSelectionContents(printable);

    var manifest = this.reader.service.manifest;

    var pages = this.reader.view.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      var page = pages[i];
      if ( ! page.dataset.seq ) {
        continue;
      }
      if ( manifest.checkFeatures(page.dataset.seq, 'MISSING_PAGE') ) {
        continue;
      }

      // <button data-role="tooltip" aria-pressed="false" aria-label="Select page">${checkboxEmptySvg}${checkboxCheckedSvg}</button> 
      var button = document.createElement('button');
      // button.classList.add('button', 'btn-mini', 'action-toggle-selection');
      button.dataset.seq = page.dataset.seq;
      button.dataset.action = 'toggle';
      button.setAttribute('aria-label', `Select page scan #${page.dataset.seq}`);
      button.setAttribute('type', 'button');
      // button.setAttribute('aria-pressed', _.indexOf(printable, parseInt(page.dataset.seq, 10)) > -1);
      button.setAttribute('aria-pressed', printable.indexOf(parseInt(page.dataset.seq, 10)) > -1);
      button.setAttribute('data-role', 'tooltip');
      button.setAttribute('data-microtip-position', 'left');
      button.setAttribute('data-microtip-size', 'small');
      button.setAttribute('tabindex', '-1');
      button.innerHTML = `${checkboxEmptySvg}${checkboxCheckedSvg}`;

      // var span = document.createElement('span');
      // span.setAttribute('aria-hidden', 'true');
      // button.appendChild(span);

      page.querySelector('.tag').insertBefore(button, page.querySelector('span'));
      // button.style.marginRight = '0.25rem';
      page.dataset.selected = button.getAttribute('aria-pressed'); page.classList.toggle('page--selected', button.getAttribute('aria-pressed') == 'true');
      // page.appendChild(button);
    }
  }

  clickHandler(event) {
    var element = event.target.closest('button[data-action="toggle"]');
    if ( element ) {
      event.preventDefault();
      event.stopPropagation();
      var page = element.closest('.page');
      this._addPageToSelection(page, element, event, true);
    }

    // if ( ! element ) {
    //   var page = event.target.closest('.page');
    //   if ( ! page ) { return ; }
    //   var button = page.querySelector('.action-toggle-selection');
    //   var x = event.clientX - button.offsetLeft + this.reader.view.container.scrollLeft;
    //   var y = event.clientY - button.offsetTop + this.reader.view.container.scrollTop;
    //   console.log("AHOY AHOY SELECT", event.clientX, event.clientY, "/", x, y);
    //   if ( ( x >= 0 && x <= button.offsetLeft ) && ( y >= 0 && y <= button.outerHeight ) ) {
    //     element = button;
    //   }
    // }
    // if ( element && element.tagName.toLowerCase() == 'button' && element.classList.contains('action-toggle-selection') ) {
    //   event.preventDefault();
    //   event.stopPropagation();
    //   var page = element.parentNode;
    //   this._addPageToSelection(page, element, event, true);
    // }
  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }

  open() {
    // using bootbox is a bit of a hack, but oh well...
    this.modal = bootbox.dialog(this.datalist, 
      [
        {label: 'Close', class: 'btn-dismiss'}
      ], 
      { header: 'Page scans selected for download' }
    );
  }

  /* SELECTION */
  _setSelection(printable) {
    var key = "selection-" + this.reader.identifier;
    if ( printable === null ) {
        sessionStorage.removeItem(key);
        return;
    }
    sessionStorage.setItem(key, JSON.stringify(printable.sort(function(a, b) { return a - b; })));
  }

  _addPageToSelection(page, input, evt, toggle) {
      var self = this;

      var checked = ! ( page.dataset.selected == "true" );

      // if ( toggle ) {
      //     $input.prop('checked', checked); // ! $input.prop('checked'));
      // }

      var seq = parseInt(page.dataset.seq, 10);
      // now deal with processing 
      var printable = self._getPageSelection();

      var is_adding = checked; // $input.prop('checked');
      var to_process = [ seq ];

      page.dataset.selected = checked; page.classList.toggle('page--selected', checked);

      input.setAttribute('aria-pressed', checked);
      // page.setAttribute('aria-label', checked ? `Page scan ${seq} is selected for download` : '');
      page.setAttribute('aria-label', checked ? `Page scan ${seq} is selected` : '');

      if ( evt && evt.shiftKey && self._last_selected_seq ) {
          // there should be an earlier selection
          var prev_until;
          var fn = checked ? function(seq) { return printable.indexOf(seq) > -1 } : function(seq) { return printable.indexOf(seq) < 0 };

          var start_seq; var end_seq; var delta;
          if ( seq > self._last_selected_seq ) {
              start_seq = seq;
              end_seq = self._last_selected_seq;
          } else {
              start_seq = self._last_selected_seq;
              end_seq = seq;
          }

          for(var prev_until_ = start_seq - 1; prev_until_ > end_seq; prev_until_--) {
              // console.log("CHECKING:", checked, prev_until_, fn(prev_until_));
              prev_until = prev_until_;
              if ( fn(prev_until_) ) {
                  break;
              }
          }

          if ( prev_until == 1 && printable.indexOf(1) < 0 ) {
              bootbox.alert("<p>Sorry.</p><p>Shift-click selects the pages between this page and an earlier selection, and we didn't find an earlier selected page.</p>");
          } else {
            var container = this.reader.view.container;
            for(var prev=start_seq; prev >= prev_until; prev--) {
              var page_prev = container.querySelector(`.page[data-seq="${prev}"]`);
              if ( page_prev ) {
                page_prev.dataset.selected = checked; page_prev.classList.toggle('page--selected', checked);
                page_prev.querySelector('button.action-toggle-selection').setAttribute('aria-pressed', checked);
                page_prev.setAttribute('aria-label', checked ? `Page scan ${prev} is selected for download` : '');
              }
              to_process.push(prev);
            }
          }
      }

      if ( is_adding ) {
          // printable = _.union(printable, to_process);
          var set = new Set(printable.concat(to_process));
          printable = [...set];
      } else {
          // printable = _.difference(printable, to_process)
          var set = new Set([...printable].filter(x => ! to_process.includes(x)));
          printable = [...set];
      }

      self._setSelection(printable);
      console.log(printable, to_process);

      var num_printable = printable.length;
      self._updateSelectionLabel(num_printable);
      self._updateSelectionContents(printable);

      self._last_selected_seq = seq;
  }

  _updateSelectionLabel(num_printable) {
      var msg = num_printable;
      if ( msg == 0 ) {
          msg = 'pages';
      } else if ( msg == 1 ) {
          msg = "1 page";
      } else {
          msg = msg + " pages";
      }

      // this.link.innerText = this.link.dataset.template.replace('{PAGES}', msg);
      // this.link.dataset.total = num_printable;

      this.reset.style.visibility = ( num_printable == 0 ? 'hidden' : 'visible' );

      return msg;
  }

  _getPageSelection() {
      var key = "selection-" + this.reader.identifier;
      var printable = [];
      try {
          printable = JSON.parse(sessionStorage.getItem(key) || "[]");
      } catch (e) {
      }
      return printable;
  }

  _getFlattenedSelection(printable) {
      var list = [];
      // _.each(printable.sort(function(a, b) { return a - b; }), function(val) {
      printable.sort(function(a, b) { return a - b; }).forEach(function(val) {
          if ( list.length == 0 ) {
              list.push([val, -1]);
          } else {
              var last = list[list.length - 1];
              if ( last[1] < 0 && val - last[0] == 1 ) {
                  last[1] = val;
              } else if ( val - last[1] == 1 ) {
                  last[1] = val;
              } else {
                  list.push([val, -1]);
              }
          }
      })

      for(var i = 0; i < list.length; i++) {
          var tmp = list[i];
          if ( tmp[1] < 0 ) {
              list[i] = tmp[0];
          } else {
              list[i] = tmp[0] + "-" + tmp[1];
          }
      }
      return list;
  }

  _updateSelectionContents(printable) {
      var self = this;

      // var msg = this.input.querySelector('.msg');
      // var button = this.input.querySelector('button');

      if ( printable.length == 0 ) {
          this.datalist.innerHTML = '';
          // msg.innerText = '';
          // button.disabled = true;
          return;
      }

      // button.disabled = false;
      // msg.innerText = ` ${printable.length} ${printable.length == 1 ? 'page' : 'pages'}`;

      this.datalist.innerHTML = '';

      var list = self._getFlattenedSelection(printable);
      list.forEach(function(args) {
          var s = args;
          var postscript = `<span><span class="offscreen">Selected page scans </span>${args}</span>`;
          if ( typeof(args) == "string" ) {
              var tmp = args.split("-");
              s = tmp[0];
              // postscript += " <span>(" + ( parseInt(tmp[1], 10) - parseInt(tmp[0], 10) + 1 ) + " pages)</span>";
          }

          var li = document.createElement('li');
          var link = document.createElement('a');
          var link_href = window.location.href.replace(/seq=\d+/, "seq=" + s).replace(/num=\d+/, '');
          if ( link_href.indexOf('seq=') < 0 ) {
            link_href += ( link_href.indexOf('&') > -1 ? '&' : ';' ) + `seq=${s}`;
          }
          link.setAttribute('href', link_href);
          link.dataset.seq = s;
          // link.innerHTML = `<img src="//${window.location.hostname}/cgi/imgsrv/thumbnail?id=${self.reader.identifier};seq=${s};width=75" />${postscript}`
          link.innerHTML = `${postscript}`;
          li.appendChild(link);
          self.datalist.appendChild(li);
      })
  }

  _clearSelection() {
      var self = this;

      var toggles = document.querySelectorAll('button.action-toggle-selection[aria-pressed="true"]');
      for(var i = 0; i < toggles.length; i++) {
        var toggle = toggles[i];
        toggle.setAttribute('aria-pressed', false);
        toggle.parentNode.dataset.selected = false; toggle.parentNode.classList.remove('page--selected');
      }

      self._setSelection(null);
      self._updateSelectionContents([]);
      self._updateSelectionLabel(0);
  }

}
