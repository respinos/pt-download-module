head.ready(function() {

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  var $emergency_access = $("#access-emergency-access");

  var delta = 5 * 60 * 1000;
  var last_seconds;
  var toggle_renew_link = function(date) {
    var now = Date.now();
    if ( now >= date.getTime() ) {
      var $link = $emergency_access.find("a[disabled]");
      $link.attr("disabled", null);
    }
  }

  var observe_expiration_timestamp = function() {
    if ( ! HT || ! HT.params || ! HT.params.id ) { return ; }
    var data = $.cookie('HTexpiration', undefined, { json: true });
    if ( ! data ) { return ; }
    var seconds = data[HT.params.id];
    // console.log("AHOY OBSERVE", seconds, last_seconds);
    if ( seconds == -1 ) {
      var $link = $emergency_access.find("p a").clone();
      $emergency_access.find("p").text("Your access has expired and cannot be renewed. Reload the page or try again later. Access has been provided through the ");
      $emergency_access.find("p").append($link);
      var $action = $emergency_access.find(".alert--emergency-access--options a");
      $action.attr('href', window.location.href);
      $action.text('Reload');
      return;
    }
    if ( seconds > last_seconds ) {
      var message = time2message(seconds);
      last_seconds = seconds;
      $emergency_access.find(".expires-display").text(message);
    }
  }

  var time2message = function(seconds) {
    var date = new Date(seconds * 1000);
    var hours = date.getHours();
    var ampm = 'AM';
    if ( hours > 12 ) { hours -= 12; ampm = 'PM'; }
    if ( hours == 12 ){ ampm = 'PM'; }
    var minutes = date.getMinutes();
    if ( minutes < 10 ) { minutes = `0${minutes}`; }
    var message = `${hours}:${minutes}${ampm} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
    return message;
  }

  if ( $emergency_access.length ) {
    var expiration = $emergency_access.data('accessExpires');
    var seconds = parseInt($emergency_access.data('accessExpiresSeconds'), 10);
    var granted = $emergency_access.data('accessGranted');

    var now = Date.now() / 1000;
    var message = time2message(seconds);
    $emergency_access.find(".expires-display").text(message);
    $emergency_access.get(0).dataset.initialized = 'true'

    if ( granted ) {
      // set up a watch for the expiration time
      last_seconds = seconds;
      setInterval(function() {
        // toggle_renew_link(date);
        observe_expiration_timestamp();
      }, 500);
    }
  }

  if ($('#accessBannerID').length > 0) {
      var suppress = $('html').hasClass('supaccban');
      if (suppress) {
          return;
      }
      var debug = $('html').hasClass('htdev');
      var idhash = $.cookie('access.hathitrust.org', undefined, {json : true});
      var url = $.url(); // parse the current page URL
      var currid = url.param('id');
      if (idhash == null) {
          idhash = {};
      }

      var ids = [];
      for (var id in idhash) {
          if (idhash.hasOwnProperty(id)) {
              ids.push(id);
          }
      }

      if ((ids.indexOf(currid) < 0) || debug) {
          idhash[currid] = 1;
          // session cookie
          $.cookie('access.hathitrust.org', idhash, { json : true, path: '/', domain: '.hathitrust.org' });

          function showAlert() {
              var html = $('#accessBannerID').html();
              var $alert = bootbox.dialog(html, [{ label: "OK", "class" : "btn btn-primary btn-dismiss" }], { header : 'Special access', role: 'alertdialog' });
          }
          window.setTimeout(showAlert, 3000, true);
      }
  }

})