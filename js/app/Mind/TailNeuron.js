"use strict";
define([
        "app/Body/BodyPart"
      , "app/Mind/Neuron"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Neuron, Box2D, PIXI) {

  var TailNeuron = Neuron.extend({
    init: function () {

    }
  });

  return TailNeuron;
});