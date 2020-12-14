head.ready(function() {
  var $menu; var $trigger; var $header; var $navigator;
  HT = HT || {};

  HT.mobify = function() {

    // if ( $("html").is(".desktop") ) {
    //   $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
    // }

    $header = $("header");
    $navigator = $(".navigator");
    if ( $navigator.length ) {
      document.documentElement.dataset.expanded = true;
      $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
      $navigator.get(0).dataset.originalHeight = `{$navigator.outerHeight()}px`;
      document.documentElement.style.setProperty('--navigator-height', `${$navigator.outerHeight()}px`);
      var $expando = $navigator.find(".action-expando");
      $expando.on('click', function() {
        document.documentElement.dataset.expanded = ! ( document.documentElement.dataset.expanded == 'true' );
        var navigatorHeight = 0;
        if ( document.documentElement.dataset.expanded == 'true' ) {
          navigatorHeight = $navigator.get(0).dataset.originalHeight;
        }
        document.documentElement.style.setProperty('--navigator-height', navigatorHeight);
      })

      if ( HT.params.ui == 'embed' ) {
        setTimeout(() => {
          $expando.trigger('click');
        }, 1000);
      }
    }

    HT.$menu = $menu;

    var $sidebar = $("#sidebar");

    $trigger = $sidebar.find("button[aria-expanded]");

    $("#action-mobile-toggle-fullscreen").on('click', function() {
      document.documentElement.requestFullScreen();
    })

    HT.utils = HT.utils || {};

    // $sidebar.on('click', function(event) {
    $("body").on('click', '.sidebar-container', function(event) {
      // hide the sidebar
      var $this = $(event.target);
      if ( $this.is("input[type='text'],select") ) {
        return;
      }
      if ( $this.parents(".form-search-volume").length ) {
        return;
      }
      if ( $this.is("button,a") ) {
        HT.toggle(false);
      }
    })

    // var vh = window.innerHeight * 0.01;
    // document.documentElement.style.setProperty('--vh', vh + 'px');

    // $(window).on("resize", function() {
    //     var vh = window.innerHeight * 0.01;
    //     document.documentElement.style.setProperty('--vh', vh + 'px');
    // })

    // $(window).on("orientationchange", function() {
    //     setTimeout(function() {
    //         var vh = window.innerHeight * 0.01;
    //         document.documentElement.style.setProperty('--vh', vh + 'px');

    //         HT.utils.handleOrientationChange();
    //     }, 100);
    // })
    if ( HT && HT.utils && HT.utils.handleOrientationChange ) {
      HT.utils.handleOrientationChange();
    }
    document.documentElement.dataset.expanded = 'true';
  }

  HT.toggle = function(state) {

    // $trigger.attr('aria-expanded', state);
    $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', state);
    $("html").get(0).dataset.sidebarExpanded = state;
    $("html").get(0).dataset.view = state ? 'options' : 'viewer';

    // var xlink_href;
    // if ( $trigger.attr('aria-expanded') == 'true' ) {
    //   xlink_href = '#panel-expanded';
    // } else {
    //   xlink_href = '#panel-collapsed';
    // }
    // $trigger.find("svg use").attr("xlink:href", xlink_href);
  }

  setTimeout(HT.mobify, 1000);

  var updateToolbarTopProperty = function() {
    var h = $("#sidebar .sidebar-toggle-button").outerHeight() || 40;
    var top = ( $("header").height() + h ) * 1.05;
    document.documentElement.style.setProperty('--toolbar-horizontal-top', top + 'px');
  }
  $(window).on('resize', updateToolbarTopProperty);
  updateToolbarTopProperty();

  $("html").get(0).setAttribute('data-sidebar-expanded', false);

})
