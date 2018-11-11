// ==UserScript==
// @name         Github Enhancements
// @namespace    turkoid
// @version      0.3
// @description  Improve Yo Self
// @author       turkoid
// @include      /^https?://(.*\.)?github\.(.*\.)?com.*$/
// @updateURL    https://raw.githubusercontent.com/turkoid/github-enhacements/master/github-enhancements.meta.js
// @downloadURL  https://raw.githubusercontent.com/turkoid/github-enhacements/master/github-enhancements.user.js
// @grant        none
// ==/UserScript==

(function() {
  "use-strict";

  // comment out ones you don't want enabled
  var enhancements = [
    "pull-request-collapse",
    "" // Leave this here because JS doesn't allow trailing commas.
  ];
  var enhancementFunctions = {};
  var listeners = [];
  var observer = new MutationObserver(observe);
  setup();
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  observe();

  function observe() {
    listeners.forEach(listener => {
      if (!listener.attr) {
        listener.attr = `data-enhanced-${listener.id}`;
        listener.realQuery = `${listener.query}:not([${listener.attr}="true"])`;
      }
      if (window.location.pathname.match(listener.path)) {
        var elements = document.querySelectorAll(listener.realQuery);
        if (elements.length > 0) {
          elements.forEach(el => {
            el.setAttribute(listener.attr, true);
          });
          if (listener.single) {
            listener.fn(listener, elements[0]);
          } else {
            if (listener.iterate) {
              elements.forEach(el => {
                listener.fn(listener, el);
              });
            } else {
              listener.fn(listener, listener.single ? elements[0] : elements);
            }
          }
        }
      }
    });
  }

  function removeListener(id) {
    listeners = listeners.filter(listener => listener.id != id);
  }

  function createElement(tag, classes) {
    var el = document.createElement(tag);
    classes.split(" ").forEach(c => {
      el.classList.add(c);
    });
    return el;
  }

  function createButton(text, classes) {
    var btn = createElement("button", classes);
    btn.type = "button";
    btn.appendChild(document.createTextNode(text));
    return btn;
  }

  function clearSelection() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
  }

  // ADD CUSTOM ONES HERE
  function setup() {
    enhancementFunctions["pull-request-collapse"] = function() {
      listeners.push({
        id: "pr-file",
        name: "Pull Request (File)",
        path: /.+?pull\/\d+\/files/,
        query: ".file-header",
        fn: enhanceFiles
      });

      function enhanceFiles(listener, files) {
        files.forEach(file => {
          file.addEventListener("dblclick", evt => {
            if (evt.target.closest(".file-actions")) return;
            var header = evt.target.closest(".file-header");
            var btn = header.querySelector(
              '.js-details-target[aria-label="Toggle diff text"]'
            );
            btn.click();
            clearSelection();
          });
        });
      }

      listeners.push({
        id: "pr-tools",
        name: "Pull Request (Header)",
        path: /.+?pull\/\d+\/files/,
        query: ".pr-review-tools",
        single: true,
        fn: enhanceHeader
      });

      function enhanceHeader(listener, header) {
        removeListener(listener.id);

        var collapseTools = createElement("div", "diffbar-item");
        var btnGroup = createElement("div", "BtnGroup");
        collapseTools.appendChild(btnGroup);

        function toggleFileDetails(toggle) {
          var files = document.querySelectorAll(
            `.js-details-target[aria-label="Toggle diff text"][aria-expanded="${toggle}"]`
          );
          files.forEach(file => file.click());
        }
        var btn = createButton(
          "Collapse all",
          "btn btn-sm btn-outline BtnGroup-item"
        );
        btn.addEventListener("click", () => toggleFileDetails(true));
        btnGroup.appendChild(btn);
        btn = createButton(
          "Expand all",
          "btn btn-sm btn-outline BtnGroup-item"
        );
        btn.addEventListener("click", () => toggleFileDetails(false));
        btnGroup.appendChild(btn);
        header.insertBefore(collapseTools, header.childNodes[0]);
      }
    };

    enhancements.forEach(enh => {
      var fn = enhancementFunctions[enh];
      if (fn) fn();
    });
  }
})();
