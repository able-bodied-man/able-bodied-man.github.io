/*
 * jQuery 3 compatibility helpers, removed in jQuery 4.0.
 *
 * Loaded immediately after jQuery 4 and before the two plugins that still call them:
 *   - Owl Carousel 2.3.4 (uses $.camelCase, $.type, $.isNumeric)
 *   - validator.js 0.11.9 (uses $.trim)
 * Both are the final releases of unmaintained projects, so instead of patching them we
 * restore the jQuery 3.7 behaviour they were written against. Each function below is a
 * faithful copy of jQuery 3.7's now-deleted implementations; delete this file together
 * with the plugins once they are replaced.
 */
(function ($) {
    "use strict";

    var rmsPrefix = /^-ms-/,
        rdashAlpha = /-([a-z])/g,
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        class2type = {};

    "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ").forEach(function (name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    });

    if (typeof $.camelCase !== "function") {
        $.camelCase = function (string) {
            return string == null ? "" : (string + "").replace(rmsPrefix, "ms-").replace(rdashAlpha, function (all, letter) {
                return letter.toUpperCase();
            });
        };
    }

    if (typeof $.trim !== "function") {
        $.trim = function (text) {
            return text == null ? "" : (text + "").replace(rtrim, "");
        };
    }

    if (typeof $.type !== "function") {
        $.type = function (obj) {
            if (obj == null) {
                return obj + "";
            }
            return typeof obj === "object" || typeof obj === "function"
                ? class2type[Object.prototype.toString.call(obj)] || "object"
                : typeof obj;
        };
    }

    if (typeof $.isFunction !== "function") {
        $.isFunction = function (obj) {
            return $.type(obj) === "function";
        };
    }

    if (typeof $.isArray !== "function") {
        $.isArray = Array.isArray;
    }

    if (typeof $.isNumeric !== "function") {
        $.isNumeric = function (obj) {
            var type = $.type(obj);
            return (type === "number" || type === "string") && !isNaN(obj - parseFloat(obj));
        };
    }

    if (typeof $.now !== "function") {
        $.now = Date.now;
    }

    if (typeof $.parseJSON !== "function") {
        $.parseJSON = function (data) {
            return JSON.parse(data + "");
        };
    }

    if (typeof $.nodeName !== "function") {
        $.nodeName = function (elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        };
    }
})(jQuery);
