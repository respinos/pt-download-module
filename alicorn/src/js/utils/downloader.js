// downloader

var HT = HT || {};
var photocopier_message = 'The copyright law of the United States (Title 17, U.S. Code) governs the making of reproductions of copyrighted material. Under certain conditions specified in the law, libraries and archives are authorized to furnish a reproduction. One of these specific conditions is that the reproduction is not to be “used for any purpose other than private study, scholarship, or research.” If a user makes a request for, or later uses, a reproduction for purposes in excess of “fair use,” that user may be liable for copyright infringement.';

HT.Downloader = {

    init: function(options) {
        this.options = $.extend({}, this.options, options);
        this.id = this.options.params.id;
        this.pdf = {};
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;
        // $("a[data-toggle*=download]").addClass("interactive").click(function(e) {
        $("a[data-toggle*=download]").addClass("interactive");
        $("body").on("click", "a[data-toggle*=download]", function(e) {            
            e.preventDefault();
            bootbox.hideAll();
            if ( $(this).attr("rel") == 'allow' ) {

                // --- THE MODE IS TOGGLED
                // if ( this.dataset.photocopier == 'true' && ! sessionStorage.getItem('photocopier.confirmed') ) {
                //     if ( ! window.confirm(photocopier_message) ) {
                //         e.stopPropagation();
                //         return false;
                //     }
                //     sessionStorage.setItem('photocopier.confirmed', true);
                // }


                if ( self.options.params.download_progress_base == null ) {
                    return true;
                }
                self.downloadPdf(this);
            } else {
                self.explainPdfAccess(this);
            }
            return false;
        })

    },

    explainPdfAccess: function(link) {
        var html = $("#noDownloadAccess").html();
        html = html.replace('{DOWNLOAD_LINK}', $(this).attr("href"));
        this.$dialog = bootbox.alert(html);
        // this.$dialog.addClass("login");
    },

    downloadPdf: function(link) {
        var self = this;
        self.$link = $(link);
        self.src = $(link).attr('href');
        self.item_title = $(link).data('title') || 'PDF';

        if ( self.$link.data('range') == 'yes' ) {
            if ( ! self.$link.data('seq') ) {
                return;
            }
        }

        var html =
            // '<p>Building your PDF...</p>' +
            `<div class="initial"><p>Setting up the download...</div>` +
            `<div class="offscreen" role="status" aria-atomic="true" aria-live="polite"></div>` +
            '<div class="progress progress-striped active hide" aria-hidden="true">' +
                '<div class="bar" width="0%"></div>' +
            '</div>' +
            // '<div class="alert alert-block alert-success done hide">' +
            //     '<p>All done!</p>' +
            // '</div>' + 
            `<div><p><a href="https://www.hathitrust.org/help_digital_library#DownloadTime" target="_blank">What affects the download speed?</a></p></div>`;

        var header = 'Building your ' + self.item_title;
        var total = self.$link.data('total') || 0;
        if ( total > 0 ) {
            var suffix = total == 1 ? 'page' : 'pages';
            header += ' (' + total + ' ' + suffix + ')';
        }

        self.$dialog = bootbox.dialog(
            html,
            [
                {
                    label : 'Cancel',
                    'class' : 'btn-x-dismiss btn',
                    callback: function() {
                        if ( self.$dialog.data('deactivated') ) {
                            self.$dialog.closeModal();
                            return;
                        }
                        $.ajax({
                            url: self.src + ';callback=HT.downloader.cancelDownload;stop=1',
                            dataType: 'script',
                            cache: false,
                            error: function(req, textStatus, errorThrown) {
                                console.log("DOWNLOAD CANCELLED ERROR");
                                // self.$dialog.closeModal();
                                console.log(req, textStatus, errorThrown);
                                if ( req.status == 503 ) {
                                    self.displayWarning(req);
                                } else {
                                    self.displayError();
                                }
                            }
                        })
                    }
                }
            ],
            {
                header: header,
                id: 'download'
            }
        );
        self.$status = self.$dialog.find("div[role=status]");

        // self.updateStatusText(`Building your ${self.item_title}.`);

        self.requestDownload();

    },

    requestDownload: function() {
        var self = this;
        var data = {};
        if ( self.$link.data('seq') ) {
            data['seq'] = self.$link.data('seq');
        }
        $.ajax({
            url: self.src.replace(/;/g, '&') + '&callback=HT.downloader.startDownloadMonitor',
            dataType: 'script',
            cache: false,
            data: data,
            error: function(req, textStatus, errorThrown) {
                console.log("DOWNLOAD STARTUP NOT DETECTED");
                if ( self.$dialog ) { self.$dialog.closeModal(); }
                if ( req.status == 429 ) {
                    self.displayWarning(req);
                } else {
                    self.displayError(req);
                }
            }
        });
    },

    cancelDownload: function(progress_url, download_url, total) {
        var self = this;
        self.clearTimer();
        self.$dialog.closeModal();
    },

    startDownloadMonitor: function(progress_url, download_url, total) {
        var self = this;

        if ( self.timer ) {
            console.log("ALREADY POLLING");
            return;
        }

        self.pdf.progress_url = progress_url;
        self.pdf.download_url = download_url;
        self.pdf.total = total;

        self.is_running = true;
        self.num_processed = 0;
        self.i = 0;

        self.timer = setInterval(function() { self.checkStatus(); }, 2500);
        // do it once the first time
        self.checkStatus();

    },

    checkStatus: function() {
        var self = this;
        self.i += 1;
        $.ajax({
            url : self.pdf.progress_url,
            data : { ts : (new Date).getTime() },
            cache : false,
            dataType: 'json',
            success : function(data) {
                var status = self.updateProgress(data);
                self.num_processed += 1;
                if ( status.done ) {
                    self.clearTimer();
                } else if ( status.error && status.num_attempts > 100 ) {
                    self.$dialog.closeModal();
                    self.displayProcessError();
                    self.clearTimer();
                    self.logError();
                } else if ( status.error ) {
                    self.$dialog.closeModal();
                    self.displayError();
                    self.clearTimer();
                }
            },
            error : function(req, textStatus, errorThrown) {
                console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                self.$dialog.closeModal();
                self.clearTimer();
                if ( req.status == 404 && (self.i > 25 || self.num_processed > 0) ) {
                    self.displayError();
                }
            }
        })
    },

    updateProgress: function(data) {
        var self = this;
        var status = { done : false, error : false };
        var percent;

        var current = data.status;
        if ( current == 'EOT' || current == 'DONE' ) {
            status.done = true;
            percent = 100;
        } else {
            current = data.current_page;
            percent = 100 * ( current / self.pdf.total );
        }

        if ( self.last_percent != percent ) {
            self.last_percent = percent;
            self.num_attempts = 0;
        } else {
            self.num_attempts += 1;
        }

        // try 100 times, which amounts to ~100 seconds
        if ( self.num_attempts > 100 ) {
            status.error = true;
        }

        if ( self.$dialog.find(".initial").is(":visible") ) {
            self.$dialog.find(".initial").html(`<p>Please wait while we build your ${self.item_title}.</p>`);
            self.$dialog.find(".progress").removeClass("hide");
            self.updateStatusText(`Please wait while we build your ${self.item_title}.`)
        }

        self.$dialog.find(".bar").css({ width : percent + '%'});

        if ( percent == 100 ) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html(`<p>All done! Your ${self.item_title} is ready for download. <span class="offscreen">Select ${download_key} to download.</span></p>`);
            self.updateStatusText(`All done! Your ${self.item_title} is ready for download. Select ${download_key} to download.`);

            // self.$dialog.find(".done").show();
            var $download_btn = self.$dialog.find('.download-pdf');
            if ( ! $download_btn.length ) {
                $download_btn = $('<a class="download-pdf btn btn-primary" download="download">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
                if ( $download_btn.get(0).download == undefined ) {
                    $download_btn.attr('target', '_blank');
                }
                $download_btn.appendTo(self.$dialog.find(".modal__footer")).on('click', function(e) {
                    self.$link.trigger("click.google");
                    setTimeout(function() {
                        self.$dialog.closeModal();
                        $download_btn.remove();
                        HT.reader.controls.selectinator._clearSelection();
                        // HT.reader.emit('downloadDone');
                    }, 1500);
                    e.stopPropagation();
                })
                $download_btn.focus();
            }
            self.$dialog.data('deactivated', true);
            // self.updateStatusText(`Your ${self.item_title} is ready for download. Press return to download.`);
            // still could cancel
        } else {
            self.$dialog.find(".initial").text(`Please wait while we build your ${self.item_title} (${Math.ceil(percent)}% completed).`);
            self.updateStatusText(`${Math.ceil(percent)}% completed`);
        }

        return status;
    },

    clearTimer: function() {
        var self = this;
        if ( self.timer ) {
            clearInterval(self.timer);
            self.timer = null;
        }
    },

    displayWarning: function(req) {
        var self = this;
        var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
        var rate = req.getResponseHeader('X-Choke-Rate')

        if ( timeout <= 5 ) {
            // just punt and wait it out
            setTimeout(function() {
              self.requestDownload();
            }, 5000);
            return;
        }

        timeout *= 1000;
        var now = (new Date).getTime();
        var countdown = ( Math.ceil((timeout - now) / 1000) )

        var html =
          ('<div>' +
            '<p>You have exceeded the download rate of {rate}. You may proceed in <span id="throttle-timeout">{countdown}</span> seconds.</p>' +
            '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' +
          '</div>').replace('{rate}', rate).replace('{countdown}', countdown);

        self.$dialog = bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-primary',
                    callback: function() {
                        clearInterval(self.countdown_timer);
                        return true;
                    }
                }
            ]
        );

        self.countdown_timer = setInterval(function() {
              countdown -= 1;
              self.$dialog.find("#throttle-timeout").text(countdown);
              if ( countdown == 0 ) {
                clearInterval(self.countdown_timer);
              }
              console.log("TIC TOC", countdown);
        }, 1000);

    },

    displayProcessError: function(req) {
        var html =
            '<p>' + 
                'Unfortunately, the process for creating your PDF has been interrupted. ' + 
                'Please click "OK" and try again.' + 
            '</p>' +
            '<p>' +
                'If this problem persists and you are unable to download this PDF after repeated attempts, ' + 
                'please notify us at <a href="/cgi/feedback/?page=form" data=m="pt" data-toggle="feedback tracking-action" data-tracking-action="Show Feedback">feedback@issues.hathitrust.org</a> ' +
                'and include the URL of the book you were trying to access when the problem occurred.' +
            '</p>';

        // bootbox.alert(html);
        bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-inverse'
                }
            ],
            { classes : 'error' }
        );

        console.log(req);
    },

    displayError: function(req) {
        var html =
            '<p>' +
                'There was a problem building your ' + this.item_title + '; staff have been notified.' +
            '</p>' +
            '<p>' +
                'Please try again in 24 hours.' +
            '</p>';

        // bootbox.alert(html);
        bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-inverse'
                }
            ],
            { classes : 'error' }
        );

        console.log(req);
    },

    logError: function() {
        var self = this;
        $.get(self.src + ';num_attempts=' + self.num_attempts);
    },

    updateStatusText: function(message) {
        var self = this;
        if ( self._lastMessage != message ) {
          if ( self._lastTimer ) { clearTimeout(self._lastTimer); self._lastTimer = null; }

          setTimeout(() => {
            self.$status.text(message);
            self._lastMessage = message;
            console.log("-- status:", message);
          }, 50);
          self._lastTimer = setTimeout(() => {
            self.$status.get(0).innerText = '';
          }, 500);

        }
    },

    EOT: true

}

head.ready(function() {
    HT.downloader = Object.create(HT.Downloader).init({
        params : HT.params
    })

    HT.downloader.start();

    var num_page_downloads = 0;
    $("a[data-photocopier]").on('click', function(e) {
        if ( this.dataset.photocopier == 'true' ) {
            if ( num_page_downloads == 0 || ( false && num_page_downloads % 5 == 0 ) ) {
                if ( ! window.confirm(photocopier_message) ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
            num_page_downloads += 1;
        }
    })

    // and do this here
    $("#selectedPagesPdfLink").on('click', function(e) {
        e.preventDefault();

        var printable = HT.reader.controls.selectinator._getPageSelection();

        if ( printable.length == 0 ) {
            var buttons = [];

            var msg = [ "<p>You haven't selected any pages to print.</p>" ];
            if ( HT.reader.view.name == '2up' ) {
                msg.push("<p>To select pages, click in the upper left or right corner of the page.");
                msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-flip.gif\" /></p>");
            } else {
                msg.push("<p>To select pages, click in the upper right corner of the page.");
                if ( HT.reader.view.name == 'thumb' ) {
                    msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-thumb.gif\" /></p>");
                } else {
                    msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-scroll.gif\" /></p>");
                }
            }
            msg.push("<p><tt>shift + click</tt> to de/select the pages between this page and a previously selected page.");
            msg.push("<p>Pages you select will appear in the selection contents <button style=\"background-color: #666; border-color: #eee\" class=\"btn square\"><i class=\"icomoon icomoon-papers\" style=\"color: white; font-size: 14px;\" /></button>");

            msg = msg.join("\n");

            buttons.push({
                label: "OK",
                'class' : 'btn-dismiss'
            });
            bootbox.dialog(msg, buttons);
            return false;
        }


        var seq = HT.reader.controls.selectinator._getFlattenedSelection(printable);

        $(this).data('seq', seq);
        HT.downloader.downloadPdf(this);
    });

});

