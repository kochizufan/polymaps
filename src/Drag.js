po.drag = function() {
  var drag = {},
      map,
      container,
      dragging,
      type;

  var statics = {
    START: po.browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
    END: {
      mousedown: 'mouseup',
      touchstart: 'touchend'
    },
    MOVE: {
      mousedown: 'mousemove',
      touchstart: 'touchmove'
    }
  };

  function mousedown(e) {
    if (e.shiftKey) return;
    if (e.touches && e.touches.length > 1) { return; }

    var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
    type = e.type;
    dragging = {
      x: first.clientX,
      y: first.clientY
    };
    //map.focusableParent().focus();
    e.preventDefault();
    document.body.style.setProperty("cursor", "move", null);
  }

  function mousemove(e) {
    if (!dragging || e.type !== statics.MOVE[type]) return;
    if (e.touches && e.touches.length > 1) { return; }

    var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
    map.panBy({x: first.clientX - dragging.x, y: first.clientY - dragging.y});
    dragging.x = first.clientX;
    dragging.y = first.clientY;
  }

  function mouseup(e) {
    if (!dragging || e.type !== statics.END[type]) return;
    if (!e.touches) { mousemove(e); }
    dragging = null;
    document.body.style.removeProperty("cursor");
  }

  drag.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      for (var i = statics.START.length - 1; i >= 0; i--) {
        container.removeEventListener(statics.START[i], mousedown, false);
      }
      container = null;
    }
    if (map = x) {
      container = map.container();
      for (var i = statics.START.length - 1; i >= 0; i--) {
        container.addEventListener(statics.START[i], mousedown, false);
      }
    }
    return drag;
  };

  for (var i = statics.START.length - 1; i >= 0; i--) {
    document.addEventListener(statics.MOVE[statics.START[i]], mousemove, false);
    document.addEventListener(statics.END[statics.START[i]],  mouseup,   false);
  }

  return drag;
};
