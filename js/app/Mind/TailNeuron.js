"use strict";
define([
        "app/Mind/Neuron"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Neuron, Box2D, PIXI) {

  var TailNeuron = Neuron.extend({
    init: function (data) {
      /*
        dendrites:
          0: distance from eye to wall
        axons:
          i: motor speed for joint at index i

        FOR NOW:
        Assumes keyPositions[0] is the at-rest position
        and keyPositions[1] is the attack position


        Information you can pass via the data parameter:
        maxMotorSpeed
        targetPosition // will be set as the initial target position
        keyPositions // a list of key positions that can be used as targets
        distanceThreshold // neuron triggers an attack when inside this threshold

        Note: A "key position" is a list of target angles that match up with the joint indices

        TODO: Eventually we add a targetMovementPattern that describes a manipulation of the targetPosition
        and a patternRate or something that determines the rate the pattern is cycled through
      */

      var distanceDendrite = function ( dist ) {
        if (dist > this.distanceThreshold) { // Not yet in range
          this.targetPosition = 0;
        }
        else {
          this.targetPosition = 1;
        }
        this.impulse(); // update motor speeds
      }
      var dendrites = [ distanceDendrite ];
      this._super(dendrites); // ensures dendrites get `this` bound to this neuron

      // Initialize properties:
      if ( typeof(data) === 'undefined' ) { data = {}; }
      this.props = {
        maxMotorSpeed: 200
      , targetPosition: 0
      , keyPositions: null
      , distanceThreshold: 2 // meters
      };

      for (var key in data) {
        if (typeof(data[key]) !== 'undefined' ) { this.props[key] = data[key] };
      }

      this.motorSpeeds = null;

    }
  , linkToTail: function (tail) {
      tail.joints.forEach(function (joint, i) {
        this.axons[i] = this.axons[i] || []; // ensure that the axon exists
        this.synapse(i, joint.junctions[3], joint); // link the axon to the junction
      });

      // Set default key positions if none were set yet
      if (this.keyPositions == null) {
        var resting = [];
        var attacking = [];
        for (var i = 0; i < tail.joints.length; ++i) {
          resting[i] = 0;
          attacking[i] = ( (Math.PI/180) * (45/tail.joints.length) );
        }
      }

      // Set default motor speeds (0 for each motor)
      this.motorSpeeds = [];
      for (var i = 0; i < tail.joints.length; ++i) {
        this.motorSpeeds[i] = 0;
      }
    }
  , linkToEye: function (eye) {
      eye.junctions[0].synapse(this.dendrites[0], this);
    }
  , computeMotorSpeeds: function () {
ss
    }
  , impulse: function () {
      // propagate motor speeds to joints through associated axons
      for (var i = 0; i < this.axons.length; ++i) {
        this._super(i, this.motorSpeeds[i]); // superclass implementation of impulse(axon_index, value)
      }

    }
  });

  return TailNeuron;
});