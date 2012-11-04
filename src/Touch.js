po.touch = function() {
  var touch = {},
      map,
      container,
      rotate = false,
      last = 0,
      zoom,
      angle,
      startCircle,
      starts = {}; // touch identifier -> location

  window.addEventListener("touchmove", touchmove, false);
  window.addEventListener("touchend", touchoff, false);
  window.addEventListener("touchcancel", touchoff, false);
  
  // TODO: ignore moved touches we didn't see start
  // TODO: calculate scale/rotate for non-iOS browsers
  // TODO: restore single finger double tap to zoom in
  // TODO: handle two finger single tap to zoom out
  
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
  function recalcStartCircle() {
    var pts = [];
    for (var id in starts) pts.push(starts[id]);
    startCircle = (pts.length) ? circleInfo(pts) : null;
    if (startCircle) startCircle.location = map.pointLocation(startCircle)
    zoom = map.zoom();
  }
  
  function touchstart(e) {
    var i = -1,
        n = e.changedTouches.length,
        t = Date.now();
    
    while (++i < n) {
      var f = e.changedTouches[i];
      starts[f.identifier] = map.mouse(f);
    }
    
    // workaround for http://code.google.com/p/chromium/issues/detail?id=152913
    // ...as well as http://lists.w3.org/Archives/Public/public-webevents/2012OctDec/0022.html
    var actuallyActive = {};
    i = -1, n = e.touches.length;
    while (++i < n) actuallyActive[e.touches[i].identifier] = true;
    for (var id in starts) if (!actuallyActive[id]) delete starts[id];
    
    recalcStartCircle();
    e.preventDefault();
  }
  
  function touchmove(e) {
    var pts = [],
        i = -1,
        n = e.touches.length;
    while (++i < n) {
      var f = e.touches[i];
      if (f.identifier in starts) pts.push(map.mouse(f));
    }
    
    var circle = circleInfo(pts),
        scale = circle.r / startCircle.r,
        dZoom = (n > 1) ? Math.log(scale) / Math.LN2 + zoom - map.zoom() : 0;
    map.zoomBy(dZoom, circle, startCircle.location);
    
    e.preventDefault();
  }
  
  function touchoff(e) {
    var i = -1,
        n = e.changedTouches.length;
    while (++i < n) {
      var f = e.changedTouches[i];
      delete starts[f.identifier];
    }
    recalcStartCircle();
    e.preventDefault();
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
