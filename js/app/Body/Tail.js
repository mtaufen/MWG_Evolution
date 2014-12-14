"use strict";
define([
        "app/Body/BodyPart"
      , "app/Body/Vertebra"
      , "app/Body/RevoluteJoint"
      , "app/Mind/AfferentJunction"

      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Vertebra, RevoluteJoint, AfferentJunction, Box2D, PIXI) {

  var Tail = BodyPart.extend({
    init: function (data) {
      /*
        The tail has a single attachment point on the
        bottom of the root vertebra.

        The data object can be used to set the following values:

        numVertebrae // must be >= 1
        vertebraWidth
        vertebraHeight

        rootDensity
        rootMaxTorque

        densityReductionFactor
        torqueReductionFactor

        friction

        groupIndex
      */

      // Super init:
      this._super([], [], data.groupIndex);

      // Initialize properties:
      if ( typeof(data) === 'undefined' ) { data = {}; }
      this.props = {
        numVertebrae: 2
      , vertebraWidth: 0.1
      , vertebraHeight: 0.5
      , rootDensity: 1
      , rootMaxTorque: 75000
      , densityReductionFactor: 1
      , torqueReductionFactor: 1
      , friction: 0.5
      };

      for (var key in data) {
        if (typeof(data[key]) !== 'undefined' ) { this.props[key] = data[key] };
      }

      // Initialize vertebrae:
      // TODO: This can be optimized.
      this.vertebrae = [];
      for (var i = 0; i < this.props.numVertebrae; ++i) {
        var vertebra = new Vertebra({
          width: this.props.vertebraWidth
        , height: this.props.vertebraHeight
        , density: this.props.rootDensity * Math.pow(this.props.densityReductionFactor, i)
        , friction: this.props.friction
        , groupIndex: this.props.groupIndex
        });
        this.vertebrae[i] = vertebra;
      }

      // Initialize joints:
      this.joints = [];
      for (var i = 0; i < this.props.numVertebrae; ++i) {
        var joint = new RevoluteJoint({
          enableMotor: true
        , motorSpeed: 0
        , maxMotorTorque: this.props.rootMaxTorque * Math.pow(this.props.torqueReductionFactor, i)
        });
        this.joints[i] = joint;
      }

      // Attach parts:
      for (var i = 0; i < this.props.numVertebrae; ++i) {
        this.vertebrae[i].attach(0, this.joints[i], 0);
        if (i > 0) {
          this.joints[i].attach(1, this.vertebrae[i-1], 1);
        }
      }

      // Set attachment point that can be used to attach the tail to other body parts
      // This makes the second attachment point on the root joint
      // the attachment point for the tail.
      this.attachments[0] = this.joints[0].attachments[1];
      // Set up body part forwarding so the joint will be associated with the attachment
      // point on whatever body part we decide to attach the tail to.
      this.bodyPartForwarding = [];
      this.bodyPartForwarding[0] = this.joints[0];


      this.name = "Tail";
    }
  , addToWorld: function (world) {
      this.vertebrae[0].addToWorld(world); // Start chain reaction by adding root to the world.
    }
  , addToStage: function (stage) {
      this.vertebrae[0].addToWorld(world); // Start chain reaction by adding root to the world.
    }
  , data: function () {
      var data = this.vertebrae.map(function (vertebra) {
        return vertebra.data();
      });
      return [].concat.apply([], data);
    }
  });

  return Tail;
});