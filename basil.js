﻿#target "InDesign";(function(glob, app) {  var pub = {};  // ----------------------------------------  // constants  pub.VERSION = "0.1";  pub.CMYK = "CMYK";  pub.RGB = "RGB";  pub.PT = "pt";  pub.PX = "px";  pub.CM = "cm";  pub.MM = "mm";  var ERROR_PREFIX = "### Basil Error -> ";  // ----------------------------------------  // private vars  var _doc = null,    _page = null,    _layer = null,    _unit = null,    _colorMode = null,    _fillColor = null,    _strokeColor = null,    _strokeTint = null,    _fillTint = null,    _strokeWeight = null;  // ----------------------------------------  // global functions  if (!glob.forEach) {    glob.forEach = function(collection, cb) {      for (var i = 0, len = collection.length; i < len; i++) {        cb(collection[i]);      }    };  }    // ----------------------------------------  // Environment    pub.doc = function(d) {    return currentDoc();  };  pub.page = function(p) {    if (p === 'undefined' || p === null) return _page;    if (typeof p === 'object') {      _page = p;    } else {      _page = getPageByNumber(p);    }    return _page;  };  pub.layer = function(l) {    if (!l) return _layer;    if (typeof l === 'object') {      _layer = l;    } else {      _layer = currentDoc().layers.item(l);      if (!_layer.isValid) {        _layer = currentDoc().layers.add({name: l});      }    }    return _layer;  };  pub.units = function (u) {    if (!u) return _unit;    if (u === pub.CM ||         u === pub.MM ||        u === pub.PT ||         u === pub.PX ) {      _unit = u;    } else {      $.writeln( ERROR_PREFIX + "Not supported unit");    }    return _unit;  }  // ----------------------------------------  // Shape  // FIXME  /*  pub.rect = function(x, y, w, h){    var rectBounds = ['0','0','0','0'];    rectBounds[0] = y + _unit;    rectBounds[1] = x + _unit;    rectBounds[2] = (y+h) + _unit;    rectBounds[3] = (x+w) + _unit;    var rectangles = currentPage().rectangles;    var properties = {strokeWeight: _strokeWeight,                   strokeTint: _strokeTint,                   fillColor: _fillColor,                  fillTint: _fillTint,                   strokeColor: _strokeColor,                   geometricBounds: rectBounds}    return rectangles.add({withProperties:properties});  };*/  // ----------------------------------------  // Color  /**   * Sets the color mode of basil, supported: CMYK or RGB   * @param  {object} new color mode (optional)   * @return {object} current color mode   */  pub.colorMode = function(cMode) {    if (!cMode) return _layer;    if (cMode === pub.CMYK || cMode === pub.RGB) {      _colorMode = cMode;    } else {      $.writeln( ERROR_PREFIX + "Not supported color mode");    }    return _colorMode;  };  // ----------------------------------------  // Typography  pub.text = function(txt, x, y, w, h) {    var textFrame = addTextFrame();    textFrame.geometricBounds = [y+_unit, x+_unit, (y+h)+_unit, (x+w)+_unit];    textFrame.contents = txt;    return textFrame;  };    // ----------------------------------------  // Math    var currentRandom = Math.random;  pub.random = function() {    if (arguments.length === 0) return currentRandom();    if (arguments.length === 1) return currentRandom() * arguments[0];    var aMin = arguments[0],      aMax = arguments[1];    return currentRandom() * (aMax - aMin) + aMin  };  function Marsaglia(i1, i2) {    var z = i1 || 362436069,      w = i2 || 521288629;    var nextInt = function() {      z = 36969 * (z & 65535) + (z >>> 16) & 4294967295;      w = 18E3 * (w & 65535) + (w >>> 16) & 4294967295;      return ((z & 65535) << 16 | w & 65535) & 4294967295    };    this.nextDouble = function() {      var i = nextInt() / 4294967296;      return i < 0 ? 1 + i : i    };    this.nextInt = nextInt  }  Marsaglia.createRandomized = function() {    var now = new Date;    return new Marsaglia(now / 6E4 & 4294967295, now & 4294967295)  };  pub.randomSeed = function(seed) {    currentRandom = (new Marsaglia(seed)).nextDouble  };  pub.Random = function(seed) {    var haveNextNextGaussian = false,      nextNextGaussian, random;    this.nextGaussian = function() {      if (haveNextNextGaussian) {        haveNextNextGaussian = false;        return nextNextGaussian      }      var v1, v2, s;      do {        v1 = 2 * random() - 1;        v2 = 2 * random() - 1;        s = v1 * v1 + v2 * v2      } while (s >= 1 || s === 0);      var multiplier = Math.sqrt(-2 * Math.log(s) / s);      nextNextGaussian = v2 * multiplier;      haveNextNextGaussian = true;      return v1 * multiplier    };    random = seed === undef ? Math.random : (new Marsaglia(seed)).nextDouble  };      pub.map = function(value, istart, istop, ostart, ostop) {    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));  };      pub.constrain = function(aNumber, aMin, aMax) {    return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;  };  // ----------------------------------------  // Input    pub.findByLabel = function(l) {    // FIXME always return array with either one or all pageItems with the given label    return currentDoc().pageItems.item(l);  };  // ----------------------------------------  // Output    pub.println = function(msg) {    $.writeln(msg);  };  pub.print = function(msg) {    $.write(msg);  };    // ----------------------------------------  // all private from here  var init = function() {    glob.b = pub;    // -- init vars --    _unit = pub.PT;    _colorMode = pub.CMYK;    _fillColor = currentDoc().swatches.item("Black"),    _strokeColor = currentDoc().swatches.item("Black");    _strokeWeight = "1pt";    _strokeTint = 100;    _fillTint = 100;    welcome();    // TODO store document units    try {      runUserScript();      } finally {      // TODO reset document units      }  };  var runUserScript = function() {    app.doScript(function() {      if (typeof glob.setup === 'function') {        glob.setup();      }      if (typeof glob.draw === 'function') {        glob.draw();      }          }, ScriptLanguage.javascript, undefined, UndoModes.entireScript);  };  var welcome = function() {    $.writeln("basil.js "        + pub.VERSION        + " "        + "infos, feedback @ http://basiljs.ch");  };    var currentDoc = function() {    if (!_doc) {      try {        _doc = app.activeDocument;        } catch(e) {        _doc = app.documents.add();      }    }    return _doc;  };  var currentLayer = function() {    if (!_layer) {      currentDoc();      _layer = app.activeDocument.activeLayer;    }    return _layer;  };    var currentPage = function() {    if (!_page) {      currentDoc();      _page = app.activeWindow.activePage;    }    return _page;  };    var getPageByNumber = function(num) {    return currentDoc().pages.item(num);  };    var addTextFrame = function() {    var textFrames = currentPage().textFrames;    return _layer ? textFrames.add(_layer) : textFrames.add();  };    init();  })(this, app);