/*
* Template Name: BreezyCV - Resume / CV / vCard / Portfolio Template
* Author: LMPixels
* Author URL: http://themeforest.net/user/lmpixels
* Version: 1.7.0
*/

(function($) {
"use strict";
    // Portfolio subpage filters
    // Shuffle 7 ships as an ES module, so it may not be on the window when this runs: main.js is a
    // classic script and can execute before the module in index.html. If it is missing, wait for the
    // loader's one-shot 'shuffle:ready' event, and build the single instance only once either way.
    var portfolioShuffle = null;

    function portfolio_init() {
        var grid = document.querySelector('.portfolio-grid');

        if (!grid || portfolioShuffle) {
            return;
        }

        if (typeof window.Shuffle === 'undefined') {
            window.addEventListener('shuffle:ready', portfolio_init, { once: true });
            return;
        }

        portfolioShuffle = new Shuffle(grid, {
            itemSelector: 'figure',
            speed: 450,
            filterMode: Shuffle.FilterMode.ANY
        });

        $('.portfolio-filters').on("click", ".filter", function (e) {
            e.preventDefault();
            $('.portfolio-filters .filter').parent().removeClass('active');
            $(this).parent().addClass('active');

            var group = $(this).attr('data-group');
            portfolioShuffle.filter(group === 'category_all' ? Shuffle.ALL_ITEMS : group);
        });
    }
    // /Portfolio subpage filters


    // Hide Mobile menu
    function mobileMenuHide() {
        var windowWidth = $(window).width(),
            siteHeader = $('#site_header');

        if (windowWidth < 1025) {
            siteHeader.addClass('mobile-menu-hide');
            $('.menu-toggle').removeClass('open');
            setTimeout(function(){
                siteHeader.addClass('animate');
            }, 500);
        } else {
            siteHeader.removeClass('animate');
        }
    }
    // /Hide Mobile menu

    // Custom scroll
    // perfect-scrollbar 1.x dropped its jQuery wrapper, so each container gets its own
    // instance, kept on the element itself: customScroll() creates or destroys them with
    // the breakpoint and psUpdate() refreshes the geometry on resize.
    function psUpdate() {
        $('.animated-section, .single-page-content').each(function() {
            if (this.__ps) {
                this.__ps.update();
            }
        });
    }

    function customScroll() {
        var windowWidth = $(window).width();
        if (windowWidth > 1024) {
            $('.animated-section, .single-page-content').each(function() {
                if (window.PerfectScrollbar && !this.__ps) {
                    this.__ps = new PerfectScrollbar(this);
                }
            });
        } else {
            $('.animated-section, .single-page-content').each(function() {
                if (this.__ps) {
                    this.__ps.destroy();
                    this.__ps = null;
                }
            });
        }
    }
    // /Custom scroll

    // Contact form - built on the browser's own Constraint Validation API, which replaced the
    // unmaintained validator.js (last release January 2017). Same presentation as before: the
    // .form-group takes .has-error and its .help-block.with-errors carries the field's data-error
    // text, which is exactly what this theme's CSS is keyed to. The form is marked novalidate so
    // the browser never shows its own bubbles over the styled messages.
    (function () {
        var form = document.getElementById('contact_form');
        if (!form) { return; }

        var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));

        function setState(field, invalid) {
            var group = field.closest('.form-group');
            if (!group) { return; }
            var help = group.querySelector('.help-block');
            if (invalid) {
                group.classList.add('has-error', 'has-danger');
                if (help) { help.textContent = field.getAttribute('data-error') || 'Please check this field.'; }
            } else {
                group.classList.remove('has-error', 'has-danger');
                if (help) { help.textContent = ''; }
            }
        }

        function validate(field) {
            var invalid = !field.checkValidity();
            setState(field, invalid);
            return !invalid;
        }

        fields.forEach(function (field) {
            // mirrors the old plugin: a flagged field clears as soon as it becomes valid, and a
            // field with content is checked once the visitor leaves it
            field.addEventListener('input', function () {
                if (field.closest('.form-group').classList.contains('has-error')) { validate(field); }
            });
            field.addEventListener('blur', function () {
                if (field.value !== '') { validate(field); }
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var valid = fields.map(function (f) { return validate(f); }).indexOf(false) === -1;
            if (!valid) {
                var firstInvalid = fields.filter(function (f) { return !f.checkValidity(); })[0];
                if (firstInvalid) { firstInvalid.focus(); }
                return;
            }

            // GitHub Pages serves static files only: there is no PHP runtime here, so the
            // original contact_form/contact_form.php POST can never succeed. Hand the message
            // to the visitor's own mail client instead. Change CONTACT_EMAIL to move the inbox.
            // Built from parts so the address never appears as a literal in the
            // source (the site displays "able_bodied_man [at] outlook.com" for the
            // same anti-spam reason. \u0040 is "@".
            var CONTACT_EMAIL = ["able_bodied_man", "outlook.com"].join("\u0040");

            var body = document.getElementById('form_message').value + "\n\n\u2014\n"
                     + document.getElementById('form_name').value + "\n" + document.getElementById('form_email').value;
            var href = "mailto:" + CONTACT_EMAIL
                     + "?subject=" + encodeURIComponent(document.getElementById('form_subject').value)
                     + "&body=" + encodeURIComponent(body);

            var messages = form.querySelector('.messages');
            if (messages) {
                messages.innerHTML = '<div class="alert alert-success alert-dismissable">Opening your email app\u2026</div>';
            }

            window.location.href = href;
        });
    })();
    // /Contact form validator

    //On Window load & Resize
    $(window)
        .on('load', function() { //Load
            // Animation on Page Loading
            $(".preloader").fadeOut( 800, "linear" );

            // initializing page transition.
            var ptPage = $('.animated-sections');
            if (ptPage[0]) {
                PageTransitions.init({
                    menu: 'ul.main-menu',
                });
            }
        })
        .on('resize', function() { //Resize
             mobileMenuHide();
             psUpdate();
             customScroll();
        });


    // On Document Load
    $(document).ready(function () {
        var movementStrength = 23;
        var height = movementStrength / $(document).height();
        var width = movementStrength / $(document).width();
        $("body").on('mousemove', function(e){
            var pageX = e.pageX - ($(document).width() / 2),
                pageY = e.pageY - ($(document).height() / 2),
                newvalueX = width * pageX * -1,
                newvalueY = height * pageY * -1,
                elements = $('.lm-animated-bg');

            elements.addClass('transition');
            elements.css({
                "background-position": "calc( 50% + " + newvalueX + "px ) calc( 50% + " + newvalueY + "px )",
            });

            setTimeout(function() {
                elements.removeClass('transition');
            }, 300);
        })

        // Mobile menu
        $('.menu-toggle').on("click", function () {
            $('#site_header').addClass('animate');
            $('#site_header').toggleClass('mobile-menu-hide');
            $('.menu-toggle').toggleClass('open');
        });

        // Mobile menu hide on main menu item click
        $('.main-menu').on("click", "a", function (e) {
            mobileMenuHide();
        });

        // Sidebar toggle
        $('.sidebar-toggle').on("click", function () {
            $('#blog-sidebar').toggleClass('open');
        });

        // Initialize Portfolio grid
        var $portfolio_container = $(".portfolio-grid");
        $portfolio_container.imagesLoaded(function () {
            portfolio_init(this);
        });

        // Blog grid init
        var $container = $(".blog-masonry");
        $container.imagesLoaded(function(){
            $container.masonry();
        });

        customScroll();

        // Carousels (role rotation, testimonials, clients) are set up by js/carousel.js,
        // which replaced Owl Carousel 2 with Embla Carousel 8.


        //Form Controls
        $('.form-control')
            .val('')
            .on("focusin", function(){
                $(this).parent('.form-group').addClass('form-group-focus');
            })
            .on("focusout", function(){
                if($(this).val().length === 0) {
                    $(this).parent('.form-group').removeClass('form-group-focus');
                }
            });

        // Lightbox init
        $('body').magnificPopup({
            delegate: 'a.lightbox',
            type: 'image',
            removalDelay: 300,

            // Class that is added to popup wrapper and background
            // make it unique to apply your CSS animations just to this exact popup
            mainClass: 'mfp-fade',
            image: {
                // options for image content type
                titleSrc: 'title',
                gallery: {
                    enabled: true
                },
            },

            iframe: {
                markup: '<div class="mfp-iframe-scaler">'+
                        '<div class="mfp-close"></div>'+
                        '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
                        '<div class="mfp-title mfp-bottom-iframe-title"></div>'+
                      '</div>', // HTML markup of popup, `mfp-close` will be replaced by the close button

                patterns: {
                    youtube: {
                      index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).

                      id: null, // String that splits URL in a two parts, second part should be %id%
                      // Or null - full URL will be returned
                      // Or a function that should return %id%, for example:
                      // id: function(url) { return 'parsed id'; }

                      src: '%id%?autoplay=1' // URL that will be set as a source for iframe.
                    },
                    vimeo: {
                      index: 'vimeo.com/',
                      id: '/',
                      src: '//player.vimeo.com/video/%id%?autoplay=1'
                    },
                    gmaps: {
                      index: '//maps.google.',
                      src: '%id%&output=embed'
                    }
                },

                srcAction: 'iframe_src', // Templating object key. First part defines CSS selector, second attribute. "iframe_src" means: find "iframe" and set attribute "src".
            },

            callbacks: {
                markupParse: function(template, values, item) {
                 values.title = item.el.attr('title');
                }
            },
        });

        //Google Maps
        if ($(".lmpixels-map")[0]){
            var address = "Ruins of Saint Paul's", // location shown on the contact map
                address = encodeURIComponent(address),
                src = 'https://maps.google.com/maps?q=' + address + '&t=m&z=16&output=embed&iwloc=near';
            $(".lmpixels-map iframe").attr("src", src);
        }

        $('.messages').on('click', '.close', function(){
            $(this).parent().remove();
        });
    });

})(jQuery);
