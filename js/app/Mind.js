"use strict";
define( [ "app/Mind/Brain"
        , "app/Mind/Neuron"
        , "app/Mind/AfferentJunction"
        , "app/Mind/EfferentJunction" ]
      , function (Brain, Neuron, AfferentJunction, EfferentJunction) {

  var Mind = {};
  Mind.Brain = Brain;
  Mind.Neuron = Neuron;
  Mind.AfferentJunction = AfferentJunction;
  Mind.EfferentJunction = EfferentJunction;

  return Mind;
});