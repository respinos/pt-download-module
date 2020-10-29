var HT = HT || {};
head.ready(function() {

  // var $status = $("div[role=status]");

  // var lastMessage; var lastTimer;
  // HT.update_status = function(message) {
  //     if ( lastMessage != message ) {
  //       if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

  //       setTimeout(() => {
  //         $status.text(message);
  //         lastMessage = message;
  //         console.log("-- status:", message);
  //       }, 50);
  //       lastTimer = setTimeout(() => {
  //         $status.get(0).innerText = '';
  //       }, 500);

  //     }
  // }

  HT.renew_auth = function(entityID, source='image') {
    if ( HT.__renewing ) { return ; }
    HT.__renewing = true;
    setTimeout(() => {
      var reauth_url = `https://${HT.service_domain}/Shibboleth.sso/Login?entityID=${entityID}&target=${encodeURIComponent(window.location.href)}`;
      var retval = window.confirm(`We're having a problem with your session; select OK to log in again.`);
      if ( retval ) {
        window.location.href = reauth_url;
      }
    }, 100);
  }

  HT.analytics = HT.analytics || {};
  HT.analytics.logAction = function(href, trigger) {
    if ( href === undefined ) { href = location.href ; }
    var delim = href.indexOf(';') > -1 ? ';' : '&';
    if ( trigger == null ) { trigger = '-'; }
    href += delim + 'a=' + trigger;
    // $.get(href);
    $.ajax(href, 
    {
      complete: function(xhr, status) {
        var entityID = xhr.getResponseHeader('x-hathitrust-renew');
        if ( entityID ) {
          HT.renew_auth(entityID, 'logAction');
        }
      }
    })
  }


  $("body").on('click', 'a[data-tracking-category="outLinks"]', function(event) {
    // var trigger = $(this).data('tracking-action');
    // var label = $(this).data('tracking-label');
    // if ( label ) { trigger += ':' + label; }
    var trigger = 'out' + $(this).attr('href');
    HT.analytics.logAction(undefined, trigger);
  })


})