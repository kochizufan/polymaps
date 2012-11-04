po.touch = function() {
  var touch = {},
      map,
      container;
  
  // TODO: calculate rotation for non-iOS browsers
  // TODO: restore single finger double tap to zoom in
  // TODO: handle two finger single tap to zoom out
  
  var zoom,
      start,
      touches = {},
      dirtyStates = {},
      displayTimeout = null;
  
  function updateTouches(changed, type) {
    var i = -1,
        n = changed.length;
    while (++i < n) {
      var f = changed[i],
          id = f.identifier;
      switch (type) {
        case 'start':
          touches[id] = {};
          touches[id]['start'] = touches[id]['current'] = map.mouse(f);
          break;
        case 'current':
          if (touches[id]) touches[id]['current'] = map.mouse(f);
          break;
        case 'finish':
          delete touches[id];
          break;
      }
    }
    dirtyStates[type] = true;
    if (type === 'current') requestDisplayUpdate(type);
  }
  
  function updateDisplay() {
    if (dirtyStates.start || dirtyStates.finish) {
      zoom = map.zoom();
      start = touchCircle('start');
    }
    dirtyStates = {};
    displayTimeout = null;
    
    var current = touchCircle('current'),
        dZoom = (current.n > 1) ? Math.log(current.r / start.r) / Math.LN2 + zoom - map.zoom() : 0;
    if (current.n) map.zoomBy(dZoom, current, start.location);
  }
  
  function requestDisplayUpdate(type) {
    if (displayTimeout) return;
    else displayTimeout = setTimeout(updateDisplay, 0);
  }
  
  function touchCircle(type) {
    var pts = [],
        circle;
    for (var id in touches) if (touches[id][type]) pts.push(touches[id][type]);
    circle = (pts.length) ? circleInfo(pts) : {};
    circle.n = pts.length;
    if (circle && type !== 'current') circle.location = map.pointLocation(circle);
    return circle;
  }
  
  function circleInfo(positions) {   // return {x,y,r} of positions
    var i = 0,
        n = positions.length,
        c = {x:positions[0].x, y:positions[0].y};
    while (++i < n) c.x += positions[i].x, c.y += positions[i].y;
    c.x /= n, c.y /= n, c.r = 0, i = -1;
    while (++i < n) {
      var dX = positions[i].x - c.x,
          dY = positions[i].y - c.y,
          radiusSqd = dX * dX + dY * dY;
      if (radiusSqd > c.r) c.r = radiusSqd;
    }
    c.r = Math.sqrt(c.r);
    return c;
  }
  
  function touchstart(e) {
    updateTouches(e.changedTouches, 'start');
    e.preventDefault();
    
    // workaround for http://code.google.com/p/chromium/issues/detail?id=152913
    var actuallyActive = {},
        i = -1,
        n = e.touches.length;
    while (++i < n) actuallyActive[e.touches[i].identifier] = true;
    for (var id in touches) if (!actuallyActive[id]) delete touches[id];
    
    var el = e.target;
    if (el.__polymaps_touch_listeners__) return;
    el.addEventListener('touchmove', touchmove, false);
    el.addEventListener('touchend', touchoff, false);
    el.addEventListener('touchcancel', touchoff, false);
    el.__polymaps_touch_listeners__ = true;
    
    function touchmove (e) {
      updateTouches(e.changedTouches, 'current');
      e.preventDefault();
    }
    function touchoff (e) {
      updateTouches(e.changedTouches, 'finish');
      e.preventDefault();
      
      el.removeEventListener('touchmove', touchmove, false);
      el.removeEventListener('touchend', touchoff, false);
      el.removeEventListener('touchcancel', touchoff, false);
      delete el.__polymaps_touch_listeners__;
    }
  }
  
  
  /* ---- OLD CODE BELOW ---- */

  function _touchstart(e) {
    var i = -1,
        n = e.touches.length,
        t = Date.now();

    // doubletap detection
    if ((n == 1) && (t - last < 300)) {
      var z = map.zoom();
      map.zoomBy(1 - z + Math.floor(z), map.mouse(e.touches[0]));
      e.preventDefault();
    }
    last = t;

    // store original zoom & touch locations
    zoom = map.zoom();
    angle = map.angle();
    while (++i < n) {
      t = e.touches[i];
      locations[t.identifier] = map.pointLocation(map.mouse(t));
    }
  }

  function _touchmove(e) {
    switch (e.touches.length) {
      case 1: { // single-touch pan
        var t0 = e.touches[0];
        map.zoomBy(0, map.mouse(t0), locations[t0.identifier]);
        e.preventDefault();
        break;
      }
      case 2: { // double-touch pan + zoom + rotate
        var t0 = e.touches[0],
            t1 = e.touches[1],
            p0 = map.mouse(t0),
            p1 = map.mouse(t1),
            p2 = {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2}, // center point
            c0 = po.map.locationCoordinate(locations[t0.identifier]),
            c1 = po.map.locationCoordinate(locations[t1.identifier]),
            c2 = {row: (c0.row + c1.row) / 2, column: (c0.column + c1.column) / 2, zoom: 0},
            l2 = po.map.coordinateLocation(c2); // center location
        map.zoomBy(Math.log(e.scale) / Math.LN2 + zoom - map.zoom(), p2, l2);
        if (rotate) map.angle(e.rotation / 180 * Math.PI + angle);
        e.preventDefault();
        break;
      }
    }
  }

  touch.rotate = function(x) {
    if (!arguments.length) return rotate;
    rotate = x;
    return touch;
  };

  touch.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("touchstart", touchstart, false);
      container = null;
    }
    if (map = x) {
      container = map.container();
      container.addEventListener("touchstart", touchstart, false);
    }
    return touch;
  };

  return touch;
};
