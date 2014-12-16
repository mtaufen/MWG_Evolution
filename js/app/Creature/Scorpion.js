"use strict";
define([
    "lib/Class"
  , "app/Mind"
  , "app/Body" ], function (Class, Mind, Body) {

  /* This is a creature that drives around like a car, but
  has a scorpion-like tail to attack with and an eye to measure
  the distance to the wall.
  */
  var Scorpion = Class.extend({
    init: function (initialTorsoX, initialTorsoY, targetWall, data) {
      if (typeof initialTorsoX == "undefined") { initialTorsoX = 10; }
      if (typeof initialTorsoY == "undefined") { initialTorsoY = 10; }

      var b2Vec2 = Box2D.Common.Math.b2Vec2;

      var groupIndex = -2; // never collide wheel and body

      this.torso = new Body.BoxTorso(initialTorsoX, initialTorsoY, 5, 1, 0, groupIndex);

      this.leftWheel = new Body.Wheel(0.7, 0, groupIndex);
      this.leftWheelJoint = new Body.RevoluteJoint({
        enableMotor: true
      , motorSpeed: 0
      , maxMotorTorque: 75
      });
      this.torso.attach(6, this.leftWheelJoint, 0);
      this.leftWheel.attach(0, this.leftWheelJoint, 1); // attach left wheel center to left wheel joint top

      this.rightWheel = new Body.Wheel(0.7, 0, groupIndex);
      this.rightWheelJoint = new Body.RevoluteJoint({
        enableMotor: false
      , motorSpeed: 0
      , maxMotorTorque: 0
      }); // default axis is < 1.0, 0.0 >
      this.torso.attach(4, this.rightWheelJoint, 0);
      this.rightWheel.attach(0, this.rightWheelJoint, 1);

      this.eye = new Body.Eye(0.2, 0.2, groupIndex);
      this.eye.wall = targetWall;
      this.eyeJoint = new Body.WeldJoint();
      this.torso.attach(3, this.eyeJoint, 0);
      this.eye.attach(0, this.eyeJoint, 1);

      this.tail = new Body.Tail({
        groupIndex: groupIndex
      });

      this.tailNeuron = new Mind.TailNeuron({
        // options
      });
      this.tailNeuron.linkToTail(this.tail);
      this.tailNeuron.linkToEye(this.eye);
      this.torso.attach(1, this.tail, 0);
      var tailJointAngleJunctions = this.tail.joints.map(function (joint) {
        return joint.junctions[6];
      });
      var tailJointSpeedJunctions = this.tail.joints.map(function (joint) {
        return joint.junctions[3];
      });

      // Neuron to translate that input into output on the 3-junction on the left wheel joint.
      this.motorNeuron = new Mind.Neuron([
        function(desiredSpeed) {
          this.impulse(0, desiredSpeed);
        }
      ],[[]]); // Supply one unconnected axon at terminal 0
      var leftWheelJunction3 = this.leftWheelJoint.junctions[3];
      this.motorNeuron.synapse(0, leftWheelJunction3.pushImpulse, leftWheelJunction3); // Connect the efferent left wheel joint speed junction's impulse queue to the motor neuron


      // Afferent junction for input to network
      // We are using the speedControllerJunction to fake
      // environmental input.
      var speedControllerJunction = new Mind.AfferentJunction(null, function () {
        return 10;
      });
      speedControllerJunction.synapse(this.motorNeuron.dendrites[0]);

      var eyeJunction = this.eye.junctions[0];

      // Record the junctions that the brain is allowed to use.
      var afferents = [   speedControllerJunction
                        , eyeJunction
                      ].concat(tailJointAngleJunctions);
      var efferents = [leftWheelJunction3].concat(tailJointSpeedJunctions);
      // Brain impulses afferents, then impulses efferents
      this.brain = new Mind.Brain(afferents, efferents);

      this.name = "Scorpion";
    }
  , addToWorld: function (world) {
      this.torso.addToWorld(world);
    }
  , addToStage: function (stage, METER) {
      this.torso.addToStage(stage, METER);
    }
  , bodyPartData: function () {

      var data = [
                  this.torso.data()
                , this.leftWheel.data()
                , this.rightWheel.data()
                , this.eye.data()
                , this.tail.data()
                ];
      return [].concat.apply([], data);

    }
  });


  return Scorpion;
});