"use strict";
define([
        "app/Body/BodyPart"
      , "app/Mind"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Mind, Box2D, PIXI) {

  var Tail = BodyPart.extend({
    init: function () {

    }
  });

  return Tail;
});