"use strict";
define([
        "app/Mind/Neuron"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
      , "lib/Utils"
       ], function (Neuron, Box2D, PIXI, Utils) {

  var TailNeuron = Neuron.extend({
    init: function (data) {
      /*
        dendrites:
          0: distance from eye to wall
          1: array of dendrites, each of which corresponds by index to a joint, and is designed
             to recieve that joint's current angle
        axons:
          i: motor speed for joint at index i

        FOR NOW:
        Assumes keyPositions[0] is the at-rest position
        and keyPositions[1] is the attack position


        Information you can pass via the data parameter:
        maxMotorSpeeds // max motor speed for each key position
        targetPosition // will be set as the initial target position
        keyPositions // a list of key positions that can be used as targets
        distanceThreshold // neuron triggers an attack when inside this threshold

        Note: A "key position" is a list of target angles that match up with the joint indices

        TODO: Eventually we add a targetMovementPattern that describes a manipulation of the targetPosition
        and a patternRate or something that determines the rate the pattern is cycled through
      */

      var distanceDendrite = function ( dist ) {
        if (dist > this.props.distanceThreshold) { // Not yet in range
          this.props.targetPosition = 0;
        }
        else {
          this.props.targetPosition = 1;
        }
        if (this.computeMotorSpeeds()) {
          // compute motor speeds returns false if there were problems
          this.impulse(); // propagate motor speeds
        }

      }
      var dendrites = [ distanceDendrite ];
      this._super(dendrites); // ensures dendrites get `this` bound to this neuron

      // Initialize properties:
      if ( typeof(data) === 'undefined' ) { data = {}; }
      this.props = {
        maxMotorSpeeds: [2, 4] // max speeds for each position
      , targetPosition: 0
      , keyPositions: null
      , distanceThreshold: 2 // meters
      };
      for (var key in data) {
        if (typeof(data[key]) !== 'undefined' ) { this.props[key] = data[key] };
      }

    }
  , linkToTail: function (tail) {
      var dendriteGenerator = function (jointIndex) {
        return function (angle) {
          this.currentJointAngles[jointIndex] = angle;
        };
      };

      this.currentJointAngles = []; // ensure array where currentJointAngles will be stored exists

      this.dendrites[1] = []; // ensure dendrites array for dendrite 1 exists
      tail.joints.forEach(function (joint, i) {
        // connect input
        // generate an angle dendrite for this neuron and link the joint's
        // angle-propagating afferent junction to that dendrite
        this.dendrites[1][i] = dendriteGenerator(i);
        joint.junctions[6].synapse(this.dendrites[1][i], this);

        // connect output
        this.axons[i] = this.axons[i] || []; // ensure that the axon exists
        this.synapse(i, joint.junctions[3].pushImpulse, joint.junctions[3]); // link the axon to the junction
      }.bind(this));

      // Set default key positions if none were set yet
      if (this.props.keyPositions === null) {
        var resting = [];
        var attacking = [];
        for (var i = 0; i < tail.joints.length; ++i) {
          resting[i] = 0;
          attacking[i] = ( (Math.PI/180) * (-45/tail.joints.length) );
        }
        this.props.keyPositions = [resting, attacking];
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
  , computeMotorSpeeds: function () { // return true if the speeds were all calculated correctly

      if (this.currentJointAngles.length < this.axons.length) {
        return false;
      }

      for (var i = 0; i < this.axons.length; ++i) { // only need to compute speeds that are actually output
        // we find the shortest rotation to achieve the target angle

        // We normalize all angles to within 2π radians, since
        // the angles are unbounded in Box2D.
        var curAngle = Utils.Math.signedRemainder(this.currentJointAngles[i], 2*Math.PI);
        var targetAngle = Utils.Math.signedRemainder(this.props.keyPositions[this.props.targetPosition][i], 2*Math.PI);
        var angle = targetAngle - curAngle;
        angle = Utils.Math.signedRemainder( (angle + Math.PI), (2*Math.PI) ) - Math.PI;

        // motor speed is the fraction of the circle between the current angle
        // and the desired angle, multiplied by the maximum motor speed
        var turnFraction = angle / 2*Math.PI;
        this.motorSpeeds[i] = this.props.maxMotorSpeed * turnFraction;
      }

      return true;
    }
  , impulse: function () {
      // propagate motor speeds to joints through associated axons
      for (var i = 0; i < this.axons.length; ++i) {
        if (this.motorSpeeds[i] != NaN) {
          this._super(i, this.motorSpeeds[i]); // superclass implementation of impulse(axon_index, value)
        }
      }

    }
  });

  return TailNeuron;
});