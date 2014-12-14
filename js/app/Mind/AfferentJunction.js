"use strict";
define(["lib/Class"], function (Class) {
  /* An afferent junction is a connection from a body part to the nervous system.
   * It effectively serves as a sensory receptor.

   * --------
   * Values:
   * --------

   * bodyPart
   *  The body part to get data from.

   * dendrites
   *  The dendrites of the target neuron or neurons to propagate
   *  data to. These dendrites are input to that neuron, not to this
   *  junction.

   * --------
   * Methods:
   * --------

   * sense()
   *  Accesses the datum this junction observes, then returns
   *  that value. You should create a closure around the body
   *  part when you define the sense() function.

   * impulse()
   *  Propagates this junction's datum onto all connected dendrites.

   * synapse(dendrite)
   *  Connects the dendrite to this junction.

  */
  var AfferentJunction = Class.extend({
    init: function (bodyPart, sense, dendrites) {
      this.bodyPart = bodyPart;
      this.dendrites = dendrites || [];
      this.sense = sense || function () { return null; };
    }
  , impulse: function () {
      var datum = this.sense();
      this.dendrites.forEach(function (dendrite) {
        dendrite(datum);
      });
    }
  , synapse: function(dendrite, dendrite_owner) {
      this.dendrites.push(dendrite.bind(dendrite_owner));
    }

  });

  return AfferentJunction;
});