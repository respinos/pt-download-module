var HT = HT || {};
head.ready(function() {

  HT.analytics.getContentGroupData = function() {
    // cheat
    var suffix = '';
    var content_group = 4;
    if ( $("#section").data("view") == 'restricted' ) {
      content_group = 2;
      suffix = '#restricted';
    } else if ( window.location.href.indexOf("debug=super") > -1 ) {
      content_group = 3;
      suffix = '#super';
    }
    return { index : content_group, value : HT.params.id + suffix };

  }

  HT.analytics._simplifyPageHref = function(href) {
    var url = $.url(href);
    var new_href = url.segment();
    new_href.push($("html").data('content-provider'));
    new_href.push(url.param("id"));
    var qs = '';
    if ( new_href.indexOf("search") > -1 && url.param('q1')  ) {
      qs = '?q1=' + url.param('q1');
    }
    new_href = "/" + new_href.join("/") + qs;
    return new_href;
  }

  HT.analytics.getPageHref = function() {
    return HT.analytics._simplifyPageHref();
  }

})