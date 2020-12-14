// supply method for feedback system
var HT = HT || {};
HT.feedback = {};
HT.feedback.dialog = function() {
    var html =
        '<form>' +
        '    <fieldset>' +
        '        <legend>Email Address</legend>' +
        '        <label for="email" class="offscreen">EMail Address</label>' +
        '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' +
        '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Overall page readability and quality</legend>' +
        '        <div class="alert alert-help">Select one option that applies</div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" id="pt-feedback-quality-1" value="readable" />' +
        '            <label class="radio" for="pt-feedback-quality-1" >' +
        '                Few problems, entire page is readable' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" id="pt-feedback-quality-2" value="someproblems" />' +
        '            <label class="radio" for="pt-feedback-quality-2">' +
        '                Some problems, but still readable' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" value="difficult" id="pt-feedback-quality-3" />' +
        '            <label class="radio" for="pt-feedback-quality-3">' +
        '                Significant problems, difficult or impossible to read' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" value="none" checked="checked" id="pt-feedback-quality-4" />' +
        '            <label class="radio" for="pt-feedback-quality-4">' +
        '                (No problems)' +
        '            </label>' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Specific page image problems?</legend>' +
        '        <div class="alert alert-help">Select any that apply</div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-1" />' +
        '            <label for="pt-feedback-problems-1">' +
        '                Missing parts of the page' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-2"  />' +
        '            <label for="pt-feedback-problems-2">' +
        '                Blurry text' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="curved" value="1" id="pt-feedback-problems-3"  />' +
        '            <label for="pt-feedback-problems-3">' +
        '                Curved or distorted text' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <label for="pt-feedback-problems-other">Other problem </label><input type="text" class="input-medium" name="other" value="" id="pt-feedback-problems-other"  />' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Problems with access rights?</legend>' +
        '        <span class="help-block" style="margin-bottom: 1rem;"><strong>' +
        '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' +
        '        </strong></span>' +
        '        <div class="alert alert-help">Select one option that applies</div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="noaccess" id="pt-feedback-access-1" />' +
        '            <label for="pt-feedback-access-1">' +
        '                This item is in the public domain, but I don\'t have access to it.' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="access" id="pt-feedback-access-2" />' +
        '            <label for="pt-feedback-access-2">' +
        '                    I have access to this item, but should not.' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="none" checked="checked" id="pt-feedback-access-3" />' +
        '            <label for="pt-feedback-access-3">' +
        '                (No problems)' +
        '            </label>' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' + 
        '        <legend>Other problems or comments?</legend>' +
        '        <p>' +
        '            <label class="offscreen" for="comments">Other problems or comments?</label>' +
        '            <textarea id="comments" name="comments" rows="3"></textarea>' +
        '        </p>' +
        '    </fieldset>' +
        '</form>';

    var $form = $(html);

    // hidden fields
    $("<input type='hidden' name='SysID' />").val(HT.params.id).appendTo($form);
    $("<input type='hidden' name='RecordURL' />").val(HT.params.RecordURL).appendTo($form);

    if ( HT.crms_state ) {
        $("<input type='hidden' name='CRMS' />").val(HT.crms_state).appendTo($form);
        var $email = $form.find("#email");
        $email.val(HT.crms_state);
        $email.hide();
        $("<span>" + HT.crms_state + "</span><br />").insertAfter($email);
        $form.find(".help-block").hide();
    }

    if ( HT.reader ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    } else if ( HT.params.seq ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    }
    $("<input type='hidden' name='view' />").val(HT.params.view).appendTo($form);

    // if ( HT.crms_state ) {
    //     $form.find("#email").val(HT.crms_state);
    // }


    return $form;
};
