import NanoEvents from 'nanoevents';

export var Flexinator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.reader = options.reader;
    this.emitter = new NanoEvents();

    this.$sidebar = document.querySelector('#sidebar');
    this.$sidebarToggle = document.querySelector('.sidebar-toggle button');
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    // various actions to make the UI flexible
    if ( this.$sidebarToggle ) {
      this.$sidebarToggle.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        self.sidebar();
      })
    }

  }

  sidebar(expand) {
    if ( getComputedStyle(this.$sidebarToggle.parentNode).display == 'none' ) { return; }
    if ( expand === undefined ) {
      expand = this.$sidebarToggle.getAttribute('aria-expanded') == 'true' ? false : true;
    }
    if ( expand ) {
      // sidebar is closed, so expand it!
      this.$sidebarToggle.setAttribute('aria-expanded', 'true');
      this.$sidebar.removeAttribute('hidden');
      $("header").show();
      $("footer").show();
      this.emitter.emit("track", "sidebar-expanded:true");
      this.reader.emit('resize');
    } else {
      // sidebar is expanded, so close it!
      this.$sidebarToggle.setAttribute('aria-expanded', 'false');
      this.$sidebar.setAttribute('hidden', 'hidden');
      $("header").hide();
      $("footer").hide();
      this.emitter.emit("track", "sidebar-expanded:false");
      this.reader.emit('resize');
    }
  }

}
