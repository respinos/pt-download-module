head.ready(function() {

    var DISMISS_EVENT = (window.hasOwnProperty &&
                window.hasOwnProperty('ontouchstart')) ?
                    'touchstart' : 'mousedown';

    var $menus = $("nav > ul > li:has(ul)");
    var $selected;

    var toggle = function($popup, $menu, $link) {
        if ( $popup.data('state') == 'open' ) {
            $menu.removeClass("active");
            $popup.attr('aria-hidden', 'true');
            $link.focus();
            $popup.data('state', 'closed');
        } else {
            $menu.addClass("active");
            $popup.attr('aria-hidden', 'false');
            $popup.data('state', 'open');
        }
    }

    $menus.each(function(index) {
        var $menu = $(this);
        $menu.find("li").each(function(lidx) {
            var $item = $(this);
            $item.attr('aria-role', 'presentation');
            $item.find("a").attr('aria-role', 'menuitem');
        })

        var $link = $menu.find("> a");
        var $popup = $menu.find("ul");
        var $items = $popup.find("a");
        $link.on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggle($popup, $menu, $link);
        })

        $menu.data('selected_idx', -1);
        $menu.on('keydown', function(event) {
            var code = event.code;
            var selected_idx = $menu.data('selected_idx');
            var delta = 0;
            if ( code == 'ArrowDown' ) {
                delta = 1;
            } else if ( code == 'ArrowUp' ) {
                delta = -1;
            } else if ( code == 'Escape' ) {
                toggle($popup, $menu, $link);
            }
            if ( delta == 0 ) { console.log("AHOY KEYCODE", code); return ; }
            event.stopPropagation();
            selected_idx = ( selected_idx + delta ) % $items.length;
            console.log("AHOY MENU KEYDOWN", selected_idx);
            $selected = $items.slice(selected_idx, selected_idx + 1);
            $selected.focus();
            $menu.data('selected_idx', selected_idx);
        })
    })

});
