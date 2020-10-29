// supply method for creating an embeddable URL
head.ready(function() {

    var side_short = "450";
    var side_long  = "700";
    var htId = HT.params.id;
    var embedHelpLink = "https://www.hathitrust.org/embed";

    var codeblock_txt;
    var codeblock_txt_a = function(w,h) {return '<iframe width="' + w + '" height="' + h + '" ';}
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $(
    '<div class="embedUrlContainer">' +
        '<h3>Embed This Book ' +
            '<a id="embedHelpIcon" default-form="data-default-form" ' +
                'href="' + embedHelpLink + '" target="_blank"><i class="icomoon icomoon-help" aria-hidden="true"></i><span class="offscreen">Help: Embedding HathiTrust Books</span></a></h3>' +
        '<form>' + 
        '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' +
        '    <label for="codeblock" class="offscreen">Code Block</label>' +
        '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' +
        codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + 
        '<div class="controls">' + 
            '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' +
            '<label class="radio inline" for="view-scroll">' +
                '<span class="icomoon icomoon-scroll"/> Scroll View ' +
            '</label>' + 
            '<input type="radio" name="view" id="view-flip" value="1" >' +
            '<label class="radio inline" for="view-flip">' +
                '<span class="icomoon icomoon-book-alt2"/> Flip View ' +
            '</label>' +
        '</div>' +
        '</form>' +
    '</div>'
    );


    // $("#embedHtml").click(function(e) {
    $("body").on('click', '#embedHtml', function(e) {
        e.preventDefault();
        bootbox.dialog($block, [
            {
                "label" : "Cancel",
                "class" : "btn-dismiss"
            }
    ]);

        // Custom width for bounding '.modal' 
        $block.closest('.modal').addClass("bootboxMediumWidth");

        // Select entirety of codeblock for easy copying
        var textarea = $block.find("textarea[name=codeblock]");
    textarea.on("click", function () {
        $(this).select();
    });

        // Modify codeblock to one of two views 
        $('input:radio[id="view-scroll"]').click(function () {
        codeblock_txt = codeblock_txt_a(side_short, side_long) + codeblock_txt_b; 
            textarea.val(codeblock_txt);
        });
        $('input:radio[id="view-flip"]').click(function () {
        codeblock_txt = codeblock_txt_a(side_long, side_short) + codeblock_txt_b; 
            textarea.val(codeblock_txt);
        });
    });
});

