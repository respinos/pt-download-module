import NanoEvents from 'nanoevents';

export var Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.reader = options.reader;
    this.prompt = options.prompt;
    this.form = options.form;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    var isIE = window.navigator.userAgent.indexOf("Trident/") > -1;

    this.input.addEventListener('change', (event) => {
      if ( self._mouseDown ) { 
        if ( isIE ) { self._update(false); }
        return;
      }
      this._change();
    })

    this.input.addEventListener('input', (event) => {
      if ( self._keyDown ) { self._keyDown = false; return; }
      this._update();
    })

    this.input.addEventListener("mousedown", function(event){
        self._mouseDown = true;
        self.output.classList.add('updating');
    }, false);
    this.input.addEventListener("mouseup", function(){
        self._mouseDown = false;
        self.output.classList.remove('updating');
        if ( isIE ) { self._change(); return; }
        self._update();
    }, false);


    var isTouchDevice = 'ontouchstart' in document.documentElement;
    if ( isTouchDevice ) {
      this.input.addEventListener('touchstart', (event) => {
        self._mouseDown = true;
        self.output.classList.add('updating');
      })

      this.input.addEventListener("touchend", function(event){
        self._mouseDown = false;
        self.output.classList.remove('updating');
        if ( isIE ) { self._change(); return; }
        self._update();
      }, false);
    }

    this.input.addEventListener("keydown", function(event) {
      if ( event.key == 'ArrowLeft' || event.key == 'ArrowRight' ) {
        // do not fire input events if we're just keying around
        self._keyDown = true;
      }
    }, false);

    var promptHTML;
    var pageNumRange;

    // var promptHTML = `
    // <p>Jump to a page scan by <strong>page number</strong> or <strong>page scan sequence</strong>.</p>
    // <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
    // <p><label for="navigator-jump" class="offscreen">Page number or sequence: </label><input id="navigator-jump" aria-describedby="navigator-hint-info" type="text" name="seq" class="input-medium" /></p>
    // <p class="offscreen" id="navigator-hint-info">Hints follow.</p>
    // <h3>Hints</h3>
    // <ul class="bullets">
    //   <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
    //   <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
    //   <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
    //   <li>Use a page number between ${pageNumRange}</li>
    //   <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
    //   <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    // </ul>
    // `;

    this.prompt.addEventListener('click', (event) => {
      event.preventDefault();
      // promptHTML = promptHTML.replace('%%LOCATIONS%%', this.reader.view.locations.total + 1);
      var $dialog = bootbox.dialog(
        // `<p>Jump to which page scan?</p><p><input type="text" name="seq" class="input-medium" placeholder="Enter a page scan sequence (e.g. 1-${this.reader.service.manifest.totalSeq})" /></p>`,
        self._promptHTML,
        [
          { label: "Close", class: 'btn-dismiss' },
          {
            label: "Jump",
            class: 'btn-dismiss btn btn-primary',
            callback: function(modal) {
              var input = modal.modal.querySelector('input[name="seq"]');
              var retval = this.handleValue(input.value);
              if ( retval ) {
                return true;
              }
              this.handleError($dialog);
              return false;
            }.bind(this)
          }
        ],
        {
          header: "Jump to location",
          onShow: function(modal) {
            modal.querySelector("input[name='seq']").focus();
          }
        }
      );
      var input_seq = $dialog.modal.querySelector('input[name="seq"]');
      input_seq.addEventListener('keydown', function(event) {
        if ( event.keyCode == 13 ) {
          event.preventDefault();
          var retval = this.handleValue(input_seq.value);
          if ( retval ) {
            $dialog.closeModal();
            return;            
          }
          this.handleError($dialog);
        }
      }.bind(this));
    })

    // if ( this.form ) {
    //   var input = this.form.querySelector('input[type="text"]');
    //   this.form.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     var value = (input.value || '').trim();
    //     if ( ! value ) {
    //       return;
    //     }
    //     this.handleValue(value);
    //     return false;
    //   })
    // }

    this.reader.on('ready', () => {
      this.reader.view.on('updateLocations', function(locations) {
        self._initiated = true;
        self._total = self.reader.view.locations.total;

        var max = self._total; var min = 1;
        if ( self.reader.view.locations.spine ) { max -= 1; min -= 1; }
        self.input.max = max; // setAttribute('max', max);
        self.input.min = min; // setAttribute('min', min);

        var value = self._parseLocation(self.reader.view.currentLocation());
        self.input.value = value;
        self._last_value = self.input.value

        self.render('total-seq', self._total);
        self._update();
        self.input.closest('.navigator').dataset.initialized = true;

        self._hasPageNum = ( self.reader.view.pageList != null );
        if ( self._hasPageNum) {
          var pageList = self.reader.view.pageList.pageList;
          self._pageNumRange = [
            pageList[0].pageLabel || pageList[0].page,
            pageList[pageList.length - 1].pageLabel || pageList[pageList.length - 1].page
          ].join('-');
        }

        if ( ! self._pageNumRange ) {
          self._promptHTML = `
              <p>Jump to a <strong>location</strong>.</p>
              <div class="alert alert-error alert-block" role="alert" aria-atomic="true" aria-live="assertive"></div>
              <p><label for="navigator-jump" class="offscreen">Location: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
              <h3>Hints</h3>
              <ul class="bullets">
                <li>Locations are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
                <li>Use a location between #1-${self.reader.view.locations.total}</li>
                <!-- <li>Use <tt>+</tt> to jump ahead by a number of locations, e.g. <strong><tt>+10</tt></strong></li>
                <li>Use <tt>-</tt> to jump back by a number of locations, e.g. <strong><tt>-10</tt></strong></li> -->
              </ul>
              `;
        } else {
          self._promptHTML = `
              <p>Jump to a location by <strong>page number</strong> or <strong>location</strong>.</p>
              <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
              <p><label for="navigator-jump" class="offscreen">Page number or location: </label><input id="navigator-jump" aria-describedby="navigator-hint-info" type="text" name="seq" class="input-medium" /></p>
              <p class="offscreen" id="navigator-hint-info">Hints follow.</p>
              <h3>Hints</h3>
              <ul class="bullets">
                <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
                <li>Locations are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
                <li>Use a location between #1-${self.reader.view.locations.total}</li>
                <li>Use a page number between ${self._pageNumRange}</li>
                <!-- <li>Use <tt>+</tt> to jump ahead by a number of locations, e.g. <strong><tt>+10</tt></strong></li>
                <li>Use <tt>-</tt> to jump back by a number of locations, e.g. <strong><tt>-10</tt></strong></li> -->
              </ul>
              `;
        }

      })
    })

    this.reader.on('relocated', function(location) {

      var value; var percentage;
      if ( ! self._initiated ) { return ; }
      if ( self._ignore ) { self._ignore = false; console.log("AHOY NAVIGATOR IGNORING relocated", self._ignore); return; }
      if ( ! ( location && location.start ) ) { return ; }

      // var check = self.reader.view.currentLocation();
      // console.log("AHOY NAVIGATOR check", check, location);

      var value;
      if ( location.start && location.end ) {
        // EPUB
        value = parseInt(self.input.value, 10);
        var start = parseInt(location.start.location, 10);
        var end = parseInt(location.end.location, 10);
        console.log("AHOY NAVIGATOR relocated", value, start, end, value < start, value > end, location);
        if ( value < start || value > end ) {
          self._last_value = value;
          value = ( value < start ) ? start : end;
          self.input.value = value;
        }
      }

      self._update();

      // self._ignore = true;

      // self.render('current-seq', value);
      // self._renderCurrentPage(value);
      // self.input.value = value;
      // self._updateInputBackground();
      // self.input.setAttribute('aria-valuenow', value);

      // var percent = Math.ceil((parseInt(value, 10) / parseInt(self.input.max, 10)) * 100.0);
      // self.input.setAttribute('aria-valuetext', `${percent}% Location ${value} of ${self.input.max}`);
    })

    // if ( this.form && this.reader.service.manifest.pageNumRange() ) {
    //   this.reader.on('relocated', (params) => {
    //     var pageNum = this.reader.service.manifest.pageNum(params.seq);
    //     this.form.querySelector('input[type="text"]').value = pageNum || '';
    //   });
    // }
  }

  handleValue(value) {
    var seq; var retval = true; var cfi = -1; var page;
    var pageList = this.reader.view.pageList;
    if ( value.substr(0, 1) == '+' || value.substr(0, 1) == '-' ) {
      var delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      var current_location = parseInt(this.input.value, 10);
      var new_location = current_location + ( delta * value);
      cfi = this.reader.view.locations.cfiFromLocation(new_location);
    } else if ( value.substr(0, 2) == 'p.' ) {
      // assume this is a location
      value = value.substr(2);
      page = pageList.pageList.find((p) => { return ( p.pageLabel == value ) }) || false;
    } else if ( value.substr(0, 1) == 'p' ) {
      value = value.substr(1);
      page = pageList.pageList.find((p) => { return ( p.pageLabel == value ) }) || false;
    } else if ( value.substr(0, 1) == '#' || value.substr(0, 1) == 'n' ) {
      value = parseInt(value.substr(1), 10);
    } else {
      // seq = parseInt(value, 10);
      page = pageList.pageList.find((p) => { return ( p.pageLabel == value ) }) || false;
      value = parseInt(value, 10);
    }

    if ( page ) {
      cfi = pageList.cfiFromPage(page.page);
    }

    if ( cfi == -1 && value && value >= 1 && value <= this.reader.view.locations.total ) {
      cfi = this.reader.view.locations.cfiFromLocation(value - 1);
    }

    if ( cfi == -1 ) {
      retval = false;
    } else {
      this.reader.trigger.push('action-prompt-seq');
      this.reader.display(cfi);
    }
    return retval;
  }

  handleError($dialog) {
    var div = $dialog.modal.querySelector('div[role="alert"]');
    var input = $dialog.modal.querySelector('input[name="seq"]');
    var value = input.value;
    var possible = '';
    var pageNumRange; // = this.reader.service.manifest.pageNumRange();
    if ( this.reader.view.pageList ) {
      var pageList = this.reader.view.pageList.pageList;
      pageNumRange = [
        pageList[0].pageLabel || pageList[0].page,
        pageList[pageList.length - 1].pageLabel || pageList[pageList.length - 1].page
      ].join('-');
    }
    if ( pageNumRange ) { possible = `page number between ${pageNumRange} or `; }
    possible += `a sequence between #1-#${this.reader.view.locations.total}`;
    div.innerHTML = `<p>Could not find a location matched ${value}; enter a ${possible}.`;
    input.focus();
  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }

  _update() {
    // this.output.classList.add('updating');
    this.render('current-seq', this.input.value);
    this._updateInputBackground();
    var value = parseFloat(this.input.value, 10);
    var current_location = value;
    var current_page = '';

    var max = parseFloat(this.input.max, 10);
    var percentage = (( value / max ) * 100.0)
    this.input.setAttribute('aria-valuenow', value);
    this.input.setAttribute('aria-valuetext', `${percentage}% • Location ${current_location} of ${this._total}${current_page}`);
    this._renderCurrentPage(this.input.value);
  }

  _change() {
    // this.output.classList.remove('updating');
    // this._updateInputBackground();
    // this.render('current-seq', this.input.value);
    // this._renderCurrentPage(this.input.value);
    this.reader.trigger.push('control-navigator');
    this.emitter.emit('updateLocation', { value: this.input.value, trigger: 'control-navigator' });
  }

  _renderCurrentPage(value) {
    // if ( false && this.reader.service.manifest.hasPageNum() ) {
    //   var page_num = this.reader.service.manifest.pageNum(value);
    //   if ( page_num ) {
    //     this.render('current-page-number', ` (${page_num})`);
    //   } else {
    //     this.render('current-page-number', '');
    //   }
    // }
  }

  _updateInputBackground() {
    var val = parseInt(this.input.value, 10);
    var total = parseInt(this.input.max, 10);
    var p = Math.ceil(( ( val - 1 ) / ( total - 1 ) ) * 100);
    var fill = '#ff9f1a';
    var end = '#444';
    this.input.style.background = `linear-gradient(to right, ${fill} 0%, ${fill} ${p}%, ${end} ${p}%, ${end} 100%)`;
  }

  _parseLocation(location) {
    var self = this;
    var value;

    if ( typeof(location.start) == 'object' ) {
      if ( location.start.location != null ) {
        value = location.start.location;
      } else {
        var percentage = self._reader.locations.percentageFromCfi(location.start.cfi);
        value = Math.ceil(self._total * percentage);
      }
    } else {
      // PDF bug
      value = parseInt(location.start, 10);
    }

    return value;
  }
}
