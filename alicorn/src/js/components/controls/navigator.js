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

    this.isRTL = this.input.getAttribute('dir') == 'rtl';

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

    var pageNumRange = this.reader.service.manifest.pageNumRange();
    this._hasPageNum = ( pageNumRange != null );

    var promptHTML = `
    <p>Jump to a page scan by <strong>page number</strong> or <strong>page scan sequence</strong>.</p>
    <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
    <p><label for="navigator-jump" class="offscreen">Page number or sequence: </label><input id="navigator-jump" aria-describedby="navigator-hint-info" type="text" name="seq" class="input-medium" /></p>
    <p class="offscreen" id="navigator-hint-info">Hints follow.</p>
    <h3>Hints</h3>
    <ul class="bullets">
      <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
      <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
      <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
      <li>Use a page number between ${pageNumRange}</li>
      <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
      <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    </ul>
    `;

    if ( ! pageNumRange ) {
      promptHTML = `
          <p>Jump to a page scan by <strong>page scan sequence</strong>.</p>
          <div class="alert alert-error alert-block" role="alert" aria-atomic="true" aria-live="assertive"></div>
          <p><label for="navigator-jump" class="offscreen">Page sequence: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
          <h3>Hints</h3>
          <ul class="bullets">
            <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
            <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
            <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
            <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
          </ul>
          `;
    }

    this.prompt.addEventListener('click', (event) => {
      event.preventDefault();
      var $dialog = bootbox.dialog(
        // `<p>Jump to which page scan?</p><p><input type="text" name="seq" class="input-medium" placeholder="Enter a page scan sequence (e.g. 1-${this.reader.service.manifest.totalSeq})" /></p>`,
        promptHTML,
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
          header: "Jump to page scan",
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

    if ( this.form ) {
      var input = this.form.querySelector('input[type="text"]');
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        var value = (input.value || '').trim();
        if ( ! value ) {
          return;
        }
        this.handleValue(value);
        return false;
      })
    }

    this.reader.on('relocated', (params) => {
      this.input.value = params.seq;
      this._update();

      // this.render('current-seq', params.seq);
      // this._renderCurrentPage(params.seq);
      // this.input.value = params.seq;
      // this._updateInputBackground();
      // this.input.setAttribute('aria-valuenow', params.seq);

      // var percent = Math.ceil((parseInt(params.seq, 10) / parseInt(this.input.max, 10)) * 100.0);
      // this.input.setAttribute('aria-valuetext', `${percent}% • Page scan ${params.seq} of ${this.input.max}`);
    })

    if ( this.form && this.reader.service.manifest.pageNumRange() ) {
      this.reader.on('relocated', (params) => {
        var pageNum = this.reader.service.manifest.pageNum(params.seq);
        this.form.querySelector('input[type="text"]').value = pageNum || '';
      });
    }
  }

  handleValue(value) {
    var seq; var retval = true;
    if ( value.substr(0, 1) == '+' || value.substr(0, 1) == '-' ) {
      var delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      this.reader.jump(delta * value);
      return;
    }

    if ( value.substr(0, 2) == 'p.' ) {
      // sequence
      seq = this.reader.service.manifest.seq(value.substr(2));
    } else if ( value.substr(0, 1) == 'p' ) {
      seq = this.reader.service.manifest.seq(value.substr(1));
    } else if ( value.substr(0, 1) == '#' || value.substr(0, 1) == 'n' ) {
      seq = parseInt(value.substr(1), 10);
    } else {
      // seq = parseInt(value, 10);
      seq = this.reader.service.manifest.seq(value);
    }
    if ( seq && seq >= 1 && seq <= this.reader.service.manifest.totalSeq ) {
      this.reader.trigger.push('action-prompt-seq');
      this.reader.display(seq);
    } else {
      retval = false;
    }
    return retval;
  }

  handleError($dialog) {
    var div = $dialog.modal.querySelector('div[role="alert"]');
    var input = $dialog.modal.querySelector('input[name="seq"]');
    var value = input.value;
    var possible = '';
    var pageNumRange = this.reader.service.manifest.pageNumRange();
    if ( pageNumRange ) { possible = `page number between ${pageNumRange} or `; }
    possible += `a sequence between #1-#${this.reader.service.manifest.totalSeq}`;
    div.innerHTML = `<p>Could not find a page scan that matched ${value}; enter a ${possible}.`;
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
    var percentage = Math.floor((( value / max ) * 100.0))
    this.input.setAttribute('aria-valuenow', value);
    this.input.setAttribute('aria-valuetext', `${current_location}/${this.input.max}`);
    // this.input.setAttribute('aria-valuetext', `${percentage}% • Location ${current_location} of ${this._total}${current_page}`);
    this._renderCurrentPage(this.input.value);
  }

  _change() {
    // this.output.classList.remove('updating');
    // this._updateInputBackground();
    // this.render('current-seq', this.input.value);
    // this._renderCurrentPage(this.input.value);
    this.reader.trigger.push('control-navigator');
    this.emitter.emit('updateLocation', { seq: this.input.value, trigger: 'control-navigator' });
  }

  _renderCurrentPage(value) {
    if ( false && this.reader.service.manifest.hasPageNum() ) {
      var page_num = this.reader.service.manifest.pageNum(value);
      if ( page_num ) {
        this.render('current-page-number', ` (${page_num})`);
      } else {
        this.render('current-page-number', '');
      }
    }
  }

  _updateInputBackground() {
    var val = parseInt(this.input.value, 10);
    var total = parseInt(this.input.max, 10);
    var p = Math.ceil(( ( val - 1 ) / ( total - 1 ) ) * 100);
    var fill = '#ff9f1a';
    var end = '#444';
    var dir = this.isRTL ? 'left' : 'right';
    this.input.style.background = `linear-gradient(to ${dir}, ${fill} 0%, ${fill} ${p}%, ${end} ${p}%, ${end} 100%)`;
  }
}
