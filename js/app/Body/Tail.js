"use strict";
define([
        "app/Body/BodyPart"
      , "app/Body/Vertebra"
      , "app/Mind/AfferentJunction"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Vertebra, AfferentJunction, Box2D, PIXI) {

  var Tail = BodyPart.extend({
    init: function (data) {
      /*
        The tail has a single attachment point on the
        bottom of the root vertebra.

        The data object can be used to set the following values:
      */

      this.vertebrae = [];
    }
    , initProperties: function (data) {

    }
  });

  return Tail;
});