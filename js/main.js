/*
* Template Name: BreezyCV - Resume / CV / vCard / Portfolio Template
* Author: LMPixels
* Author URL: http://themeforest.net/user/lmpixels
* Version: 1.7.0
*/

(function($) {
"use strict";
    // Portfolio subpage filters
    // Shuffle 6 has no jQuery wrapper, so the grid gets a single instance and its explicit
    // API. filter() takes a category and matches the JSON in each item's data-groups
    // attribute (filterMode 'any'), so the template's existing markup keeps working.
    function portfolio_init() {
        var grid = document.querySelector('.portfolio-grid');

        if (!grid || typeof Shuffle === 'undefined') {
            return;
        }

        var shuffleInstance = new Shuffle(grid, {
            itemSelector: 'figure',
            speed: 450,
            filterMode: Shuffle.FilterMode.ANY
        });

        $('.portfolio-filters').on("click", ".filter", function (e) {
            e.preventDefault();
            $('.portfolio-filters .filter').parent().removeClass('active');
            $(this).parent().addClass('active');

            var group = $(this).attr('data-group');
            shuffleInstance.filter(group === 'category_all' ? Shuffle.ALL_ITEMS : group);
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

    // Contact form validator
    $(function () {

        $('#contact_form').validator();

        $('#contact_form').on('submit', function (e) {
            if (!e.isDefaultPrevented()) {
                  // GitHub Pages serves static files only: there is no PHP runtime here, so the
                // original contact_form/contact_form.php POST can never succeed. Hand the message
                // to the visitor's own mail client instead. Change CONTACT_EMAIL to move the inbox.
                // Built from parts so the address never appears as a literal in the
                // source (the site displays "able_bodied_man [at] outlook.com" for the
                // same anti-spam reason). \u0040 is "@".
                var CONTACT_EMAIL = ["able_bodied_man", "outlook.com"].join("\u0040");

                var body = $('#form_message').val() + "\n\n\u2014\n"
                         + $('#form_name').val() + "\n" + $('#form_email').val();
                var href = "mailto:" + CONTACT_EMAIL
                         + "?subject=" + encodeURIComponent($('#form_subject').val())
                         + "&body=" + encodeURIComponent(body);

                $('#contact_form').find('.messages').html(
                    '<div class="alert alert-success alert-dismissable">Opening your email app\u2026</div>');

                window.location.href = href;
                return false;
            }
        });
    });
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

        // Text rotation
        $('.text-rotation').owlCarousel({
            loop: true,
            dots: false,
            nav: false,
            margin: 0,
            items: 1,
            autoplay: true,
            autoplayHoverPause: false,
            autoplayTimeout: 3800,
            animateOut: 'animated-section-scaleDown',
            animateIn: 'animated-section-scaleUp'
        });

        // Testimonials Slider
        $(".testimonials.owl-carousel").owlCarousel({
            nav: true, // Show next/prev buttons.
            items: 3, // The number of items you want to see on the screen.
            loop: false, // Infinity loop. Duplicate last and first items to get loop illusion.
            navText: false,
            autoHeight: true,
            margin: 25,
            responsive : {
                // breakpoint from 0 up
                0 : {
                    items: 1,
                },
                // breakpoint from 480 up
                480 : {
                    items: 1,
                },
                // breakpoint from 768 up
                768 : {
                    items: 2,
                },
                1200 : {
                    items: 2,
                }
            }
        });

        // Clients Slider
        $(".clients.owl-carousel").imagesLoaded().owlCarousel({
            nav: true, // Show next/prev buttons.
            items: 2, // The number of items you want to see on the screen.
            loop: false, // Infinity loop. Duplicate last and first items to get loop illusion.
            navText: false,
            margin: 10,
            autoHeight: true,
            responsive : {
                // breakpoint from 0 up
                0 : {
                    items: 2,
                },
                // breakpoint from 768 up
                768 : {
                    items: 4,
                },
                1200 : {
                    items: 5,
                }
            }
        });


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
