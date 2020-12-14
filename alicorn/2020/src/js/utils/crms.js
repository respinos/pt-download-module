head.ready(function() {

  if ( ! $("html").is(".crms") ) {
    return;
  }

  // if ( $(".navbar-static-top").data('loggedin') != 'YES' && window.location.protocol == 'https:' ) {
  //     // horrible hack
  //     var target = window.location.href.replace(/\$/g, '%24');
  //     var href = 'https://' + window.location.hostname + '/Shibboleth.sso/Login?entityID=https://shibboleth.umich.edu/idp/shibboleth&target=' + target;
  //     window.location.href = href;
  //     return;
  // }

  // define CRMS state
  HT.crms_state = 'CRMS-US';

  // force CRMS users to a fixed image size
  HT.force_size = 200;

  var i = window.location.href.indexOf('skin=crmsworld');
  if ( i + 1 != 0 ) {
      HT.crms_state = 'CRMS-World';
  }

  // display bib information
  var $div = $(".bibLinks");
  var $p = $div.find("p:first");
  $p.find("span:empty").each(function() {
      // $(this).text($(this).attr("content")).addClass("blocked");
      var fragment = '<span class="blocked"><strong>{label}:</strong> {content}</span>';
      fragment = fragment.replace('{label}', $(this).attr('property').substr(3)).replace('{content}', $(this).attr("content"));
      $p.append(fragment);
  })

  var $link = $("#embedHtml");
  console.log("AHOY EMBED", $link);
  $link.parent().remove();

  $link = $("a[data-toggle='PT Find in a Library']");
  $link.parent().remove();
})
