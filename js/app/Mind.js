"use strict";
define(["lib/Class"], function (Class) {

  var Mind = {};

// ----------------------------------------------------------------------------
// Brain: Access and manipulation of the input and output
//        leaves of the neural network.
// ----------------------------------------------------------------------------

  Mind.Brain = Class.extend({
    init: function (afferent_junctions, efferent_junctions) {
      this.afferent_junctions = afferent_junctions || [];
      this.efferent_junctions = efferent_junctions || [];

    }
  , think: function () {
      // Start propagating by triggering senses (afferent junctions).
      this.afferent_junctions.forEach(function (afferent) {
        afferent.impulse();
      });

      // Finish propagation by applying accumulated values on
      // efferent junctions to body parts.
      this.efferent_junctions.forEach(function (efferent) {
        efferent._impulse(); // _impulse also clears the impulse queue
      });
    }
  });

// ----------------------------------------------------------------------------
// Neuron: A processing center for mental information.
// ----------------------------------------------------------------------------

  /* A neuron serves as a node in the neural network,
   * which acts as the brain of a creature.

   * --------
   * Values:
   * --------

   * dendrites
   *  A dendrite is an incoming connection to a neuron.
   *  This is an array of functions that serve as the inputs to this neuron (you
   *  call a dendrite function to simulate a synapse signal traveling into that dendrite).
   *  The dendrite functions should be set up during the construction of a neuron.
   *  Be sure to document the index that each dendrite lives at when you write
   *  a neuron subclass.

   * axons
   *  An axon is an outgoing connection from a neuron.
   *  This is an array of arrays of dendrites. Each subarray holds references
   *  to the dendrites connected to the axon corresponding to the subarray's index.
   *  Each axon should correspond to a specific datum that the neuron can output.
   *  Be sure to document which indices correspond to which data when you write
   *  a neuron subclass.

   * --------
   * Methods:
   * --------

   * impulse (axon_index, value)
   *  Calls every dendrite in the subarray at axons[axon_index] with the value argument.

   * synapse (axon_index, dendrite, dendrite_owner)
   *  Adds the dendrite to the subarray at axons[axon_index].

  Proposed interface:
   * linkTo__ENTITIY_CLASS_NAME__(entity)
   *  Links the neuron's dendrites and axons up to the terminals on the
   *  entity, whether that entity is another neuron, a body part, or
   *  even a single junction on a body part. This is intended to be
   *  implemented in a subclass to provide functionality specific
   *  to the entity this neuron is designed to interact with.
   *  When you add implement it, replace __ENTITY_CLASS_NAME__ with
   *  the name of the class for the entity the method is designed
   *  to connect to the neuron.
   *  That way, you can have methods to link multiple different kinds
   *  of entities to your custom neuron.

   */
  Mind.Neuron = Class.extend({
    init: function (dendrites, axons) {
      this.dendrites = dendrites || [];
      this.axons = axons || [];

      // Bind each dendrite's this to the neuron object
      for (var i = 0; i < dendrites.length; ++i) {
        dendrites[i] = dendrites[i].bind(this);
      }
    }

  , impulse: function (axon_index, value) {
      if (this.axons[axon_index] instanceof Array) { // instanceof is the fastest type checking operation
        this.axons[axon_index].forEach(function (dendrite) {
          dendrite(value);
        });
      }
    }
  , synapse: function (axon_index, dendrite, dendrite_owner) {
      if (this.axons[axon_index] instanceof Array) {
        this.axons[axon_index].push(dendrite.bind(dendrite_owner));
      }
  }

  });

// ----------------------------------------------------------------------------
// Junctions: Connections between neurons and body parts.
// ----------------------------------------------------------------------------

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
  Mind.AfferentJunction = Class.extend({
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

  /* An efferent junction is a connection from a neuron to a body part.
   * It can be thought of similarly to a neuromuscular junction (a synapse
   * between efferent nerve fibers and muscle fibres).

   * --------
   * Values:
   * --------

   * bodyPart
   *  The body part this junction targets for manipulation.

   * impulseQueue
   *  The body part this junction targets for manipulation.

   * --------
   * Methods:
   * --------

   * impulse()
   *  Combines the data in the impulse queue and uses
   *  the overall result to inform some manipulation of
   *  the body part.

   * pushImpulse(value)
   *  Pushes the value onto the impulse queue.
   *  Connect this function to a neuron by using the
   *  Neuron.connect(axon_index, dendrite) method and
   *  treating pushImpulse as the dendrite.
   *  Remember to .bind() pushImpulse so that this
   *  refers to the correct junction when it is called.

  */
  Mind.EfferentJunction = Class.extend({
    init: function (bodyPart, impulse) {
      this.bodyPart = bodyPart;
      this.impulse = impulse || function () {};
      this.impulseQueue = [];
    }
  , _impulse: function () {
      this.impulse();
      this.impulseQueue = []; // clear impulse queue
    }
  , pushImpulse: function (value) {
      this.impulseQueue.push(value);
    }
  });

  return Mind;

});