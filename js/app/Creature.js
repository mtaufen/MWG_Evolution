"use strict";
define(["lib/Class", "app/Mind", "app/Body"], function (Class, Mind, Body) {
  var Creature = {};


  /* This is a demo creature class that tries to balance itself.
   * Creature classes are designed to help encapsulate the logic
   * that sets up the creature.
  */
  Creature.Car = Class.extend({
    init: function () {
      var b2Vec2 = Box2D.Common.Math.b2Vec2;

      var groupIndex = -1; // never collide wheel and body

      this.torso = new Body.BoxTorso(4, 4, 4, 1, groupIndex);

      this.leftWheel = new Body.Wheel(1, groupIndex);
      this.leftWheelJoint = new Body.RevoluteJoint(true, 1000, 7500); // default axis is < 1.0, 0.0 >
      this.torso.attach(6, this.leftWheelJoint, 0);
      this.leftWheel.attach(0, this.leftWheelJoint, 1); // attach left wheel center to left wheel joint top

      this.rightWheel = new Body.Wheel(1, groupIndex);
      this.rightWheelJoint = new Body.RevoluteJoint(); // default axis is < 1.0, 0.0 >
      this.torso.attach(4, this.rightWheelJoint, 0);
      this.rightWheel.attach(0, this.rightWheelJoint, 1);




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
        return 1000;
      });
      speedControllerJunction.synapse(this.motorNeuron.dendrites[0]);


      // Record the junctions that the brain is allowed to use.
      var afferents = [speedControllerJunction];
      var efferents = [this.leftWheelJoint.junctions[3]];
      // Brain impulses afferents, then impulses efferents
      this.brain = new Mind.Brain(afferents, efferents);

    }
  , addToWorld: function (world) {
      // We only need to add one body part to the
      // world for this creature, since every body
      // part is connected.
      this.torso.addToWorld(world);
    }
  , addToStage: function (stage, METER) {
      // Similarly, we only need to add one
      // body part to the stage.
      this.torso.addToStage(stage, METER);
    }
  , bodyPartData: function () {
      // TODO: We don't yet include the joint here since joints
      //       are not yet added to the stage for rendering, so there would
      //       be no graphics object to draw.

      var data = [
                  this.torso.data()
                , this.leftWheel.data()
                , this.rightWheel.data()
                ];
      return [].concat.apply([], data);

    }
  });


  return Creature;
});