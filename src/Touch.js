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
  
  function circleInfo(coords) {   // return {column,row,radius} of coordinates
    var i = 0,
        n = coords.length,
        c = coords[0];
    while (++i < n) c.column += coords[i].column, c.row += coords[i].row;
    c.column /= n, c.row /= n, c.radius = 0, i = -1;
    while (++i < n) {
      var dCol = coords[i].column - c.column,
          dRow = coords[i].row - c.row,
          radiusSqd = dCol * dCol + dRow * dRow;
      if (radiusSqd > c.radius) c.radius = radiusSqd;
    }
    c.radius = Math.sqrt(c.radius);
    return c;
  }
  function recalcStartCircle() {
    var coords = [];
    for (var id in starts) coords.push(starts[id].coord);
    startCircle = (coords.length) ? circleInfo(coords) : null;
    zoom = map.zoom();
    console.log("Zoom is", zoom);
  }
  
  function touchstart(e) {
    var i = -1,
        n = e.changedTouches.length,
        t = Date.now();
    
    while (++i < n) {
      var f = e.changedTouches[i];
      starts[f.identifier] = map.pointLocation(map.mouse(f));
      starts[f.identifier].coord = po.map.locationCoordinate(starts[f.identifier]);
      starts[f.identifier].time = t;
    }
    recalcStartCircle();
    e.preventDefault();
  }
  
  function touchmove(e) {
    var coords = [],
        i = -1,
        n = e.touches.length;
    while (++i < n) {
      var f = e.touches[i];
      if (f.identifier in starts) {
        var loc = map.pointLocation(map.mouse(f)),
            coord = po.map.locationCoordinate(loc);
        coords.push(coord);
      }
    }
    
    var circle = circleInfo(coords),
        scale = circle.radius / startCircle.radius;
    console.log(scale, JSON.stringify(circle), coords.length);
    if (scale && isFinite(scale)) map.zoomBy(Math.log(scale) / Math.LN2 + zoom - map.zoom());
    
    e.preventDefault();
  }
  
  function touchoff(e) {
    var f,
        i = -1,
        n = e.changedTouches.length;
    while (++i < n) {
      f = e.changedTouches[i];
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
