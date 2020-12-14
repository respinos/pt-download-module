head.ready(function() {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = '__NEW__'; // "b";

    var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

    var $toolbar = $(".collectionLinks .select-collection");
    var $errormsg = $(".errormsg");
    var $infomsg = $(".infomsg");

    function display_error(msg) {
        if ( ! $errormsg.length ) {
            $errormsg = $('<div class="alert alert-error errormsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
        HT.update_status(msg);
    }

    function display_info(msg) {
        if ( ! $infomsg.length ) {
            $infomsg = $('<div class="alert alert-info infomsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $infomsg.text(msg).show();
        HT.update_status(msg);
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function hide_info() {
        $infomsg.hide().text();
    }

    function get_url() {
        var url = "/cgi/mb";
        if ( location.pathname.indexOf("/shcgi/") > -1 ) {
            url = "/shcgi/mb";
        }
        return url;
    }

    function parse_line(data) {
        var retval = {};
        var tmp = data.split("|");
        for(var i = 0; i < tmp.length; i++) {
            var kv = tmp[i].split("=");
            retval[kv[0]] = kv[1];
        }
        return retval;
    }

    function edit_collection_metadata(args) {

        var options = $.extend({ creating : false, label : "Save Changes" }, args);

        var $block = $(
            '<form class="form-horizontal" action="mb">' +
                '<div class="control-group">' +
                    '<label class="control-label" for="edit-cn">Collection Name</label>' +
                    '<div class="controls">' +
                        '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" required />' +
                        '<span class="label counter" id="edit-cn-count">100</span>' +
                    '</div>' +
                '</div>' +
                '<div class="control-group">' +
                    '<label class="control-label" for="edit-desc">Description</label>' +
                    '<div class="controls">' +
                        '<textarea id="edit-desc" name="desc" rows="4" maxlength="255" class="input-large" placeholder="Add your collection description."></textarea>' +
                        '<span class="label counter" id="edit-desc-count">255</span>' +
                    '</div>' +
                '</div>' +
                '<div class="control-group">' +
                    '<label class="control-label">Is this collection <strong>Public</strong> or <strong>Private</strong>?</label>' +
                    '<div class="controls">' +
                        '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > ' +
                        '<label class="radio inline" for="edit-shrd-0">' +
                            'Private ' +
                        '</label>' +
                        '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > ' +
                        '<label class="radio inline" for="edit-shrd-1">' +
                            'Public ' +
                        '</label>' +
                    '</div>' +
                '</div>' +
            '</form>'
        );

        if ( options.cn ) {
            $block.find("input[name=cn]").val(options.cn);
        }

        if ( options.desc ) {
            $block.find("textarea[name=desc]").val(options.desc);
        }

        if ( options.shrd != null ) {
            $block.find("input[name=shrd][value=" + options.shrd + ']').attr("checked", "checked");
        } else if ( ! HT.login_status.logged_in ) {
            $block.find("input[name=shrd][value=0]").attr("checked", "checked");
            $('<div class="alert alert-info"><strong>This collection will be temporary</strong>. Log in to create permanent and public collections.</div>').appendTo($block);
            // remove the <label> that wraps the radio button
            $block.find("input[name=shrd][value=1]").remove();
            $block.find("label[for='edit-shrd-1']").remove();
        }

        if ( options.$hidden ) {
            options.$hidden.clone().appendTo($block);
        } else {
            $("<input type='hidden' name='c' />").appendTo($block).val(options.c);
            $("<input type='hidden' name='a' />").appendTo($block).val(options.a);
        }

        if ( options.iid ) {
            $("<input type='hidden' name='iid' />").appendTo($block).val(options.iid);
        }

        var $dialog = bootbox.dialog($block, [
            {
                "label" : "Cancel",
                "class" : "btn-dismiss"
            },
            {
                "label" : options.label,
                "class" : "btn btn-primary btn-dismiss",
                callback : function() {

                    var form = $block.get(0);
                    if ( ! form.checkValidity() ) {
                        form.reportValidity();
                        return false;
                    }

                    var cn = $.trim($block.find("input[name=cn]").val());
                    var desc = $.trim($block.find("textarea[name=desc]").val());

                    if ( ! cn ) {
                        // $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
                        return false;
                    }

                    display_info("Submitting; please wait...");
                    submit_post({
                        a : 'additsnc',
                        cn : cn,
                        desc : desc,
                        shrd : $block.find("input[name=shrd]:checked").val()
                    })
                }
            }
        ]);

        $dialog.find("input[type=text],textarea").each(function() {
            var $this = $(this);
            var $count = $("#" + $this.attr('id') + "-count");
            var limit = $this.attr("maxlength");

            $count.text(limit - $this.val().length);

            $this.bind('keyup', function() {
                $count.text(limit - $this.val().length);
            });
        })
    }

    function submit_post(params) {
        var data = $.extend({}, { page : 'ajax', id : HT.params.id }, params);
        $.ajax({
            url : get_url(),
            data : data
        }).done(function(data) {
            var params = parse_line(data);
            hide_info();
            if ( params.result == 'ADD_ITEM_SUCCESS' ) {
                // do something
                add_item_to_collist(params);
            } else if ( params.result == 'ADD_ITEM_FAILURE' ) {
                display_error("Item could not be added at this time.");
            } else {
                console.log(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        });
    }

    function add_item_to_collist(params) {
        var $ul = $(".collection-membership");
        var coll_href = get_url() + "?a=listis;c=" + params.coll_id;
        var $a = $("<a>").attr("href", coll_href).text(params.coll_name);
        $("<li></li>").appendTo($ul).append($a);
        $ul.parents("div").removeClass("hide");

        // $(".collection-membership-summary").text(IN_YOUR_COLLS_LABEL);

        // and then filter out the list from the select
        var $option = $toolbar.find("option[value='" + params.coll_id + "']");
        $option.remove();

        HT.update_status(`Added collection ${params.coll_name} to your list.`);
    }

    function confirm_large(collSize, addNumItems, callback) {

        if ( collSize <= 1000 && collSize + addNumItems > 1000 ) {
            var numStr;
            if (addNumItems > 1) {
                numStr = "these " + addNumItems + " items";
            }
            else {
                numStr = "this item";
            }
            var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 48 hours.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?"

            confirm(msg, function(answer) {
                if ( answer ) {
                    callback();
                }
            })
        } else {
            // all other cases are okay
            callback();
        }
    }

    // $("#PTaddItemBtn").click(function(e) {
    $("body").on('click', '#PTaddItemBtn', function(e) {
        e.preventDefault();
        var action = 'addI'

        hide_error();

        var selected_collection_id = $toolbar.find("select").val();
        var selected_collection_name = $toolbar.find("select option:selected").text();

        if ( ( selected_collection_id == DEFAULT_COLL_MENU_OPTION ) ) {
            display_error("You must select a collection.");
            return;
        }

        if ( selected_collection_id == NEW_COLL_MENU_OPTION ) {
            // deal with new collection
            edit_collection_metadata({
                creating : true,
                c : selected_collection_id,
                id : HT.params.id,
                a : action
            });
            return;
        }

        // var add_num_items = 1;
        // var COLL_SIZE_ARRAY = getCollSizeArray();
        // var coll_size = COLL_SIZE_ARRAY[selected_collection_id];
        // confirm_large(coll_size, add_num_items, function() {
        //     $form.submit();
        // })

        display_info("Adding item to your collection; please wait...");
        submit_post({
            c2 : selected_collection_id,
            a  : 'addits'
        });

    })

});
