"use strict";
define([
  "lib/Box2dWeb_dev"
  , "lib/pixi"
  , "lib/Utils"
  , "lib/Class"
  , "app/Mind"], function (Box2D, PIXI, Utils, Class, Mind) {

  var Body = {};

// ----------------------------------------------------------------------------
// BodyPart:
// ----------------------------------------------------------------------------

  /* The idea of the body part is somewhat fluid. It
   * could be an arm, or an eye, or a wheel, etc.

   * A key thing to remember is that each body part
   * needs to implement the data() method to
   * provide information about its Box2D bodies
   * and Pixi graphics objects.

   * --------
   * Values:
   * --------

   * attachments
   *  An array of attachment points.
   *  An attachment point looks like this
   *  when it is first initialized:
   *
   *  {
   *    anchorPoint: new Box2D.b2Vec2(x, y)
   *  , bodyPart: null
   *  , complement: null
   *  }
   *
   *  The anchor point is the physical location of
   *  this attachment point on the box2D body. It is a
   *  b2Vec2 object.
   *
   *  You should set the anchor points inside the
   *  constructor for a subclass.
   *
   *  The complement is the corresponding attachment point
   *  on the bodyPart.
   *
   *  Note that attachment points on joints do not need anchor points.
   *
   *  As a futher node, if an attachment point is on
   *  a part represented by a Box2D body, its bodyPart
   *  reference should lead to a part represented by a
   *  Box2D joint, and vice versa. This is because, as far as I can
   *  tell there is no way to connect two Box2D bodies without a joint,
   *  and no way to connect two Box2D joints without a body.
   *

   * junctions
   *  An array of junctions that interface with the body part.

   * initialX
   *  See below.

   * initialY
   *  See below.

   * initialAngle
   *  See below.

   *-----
   *  The initial position and angle values are applied to the Box2D body
   *  immediately after the Box2D body is added to the Box2D world.
   *  They are null (or 0, in the case of initialAngle) by default,
   *  but if set, certain joints will try to use them to extrapolate the
   *  positions of connected body parts.
   *  The extrapolation process is described below in general pseudocode for a
   *  joint with an initial reference angle, but you should note that certain
   *  joints may clamp the angle within their limits if limits are set,
   *  etc, depending on the joint.
   *
   *  Position Extrapolation Process:
   *
   *  Given two body parts A and B, connected by a joint body part J at
   *  attachment points attachA and attachB, respectively:
   *
   *  IMPORTANT:
   *  It is assumed that creatures are always added through the world
   *  through a body part represented by a Box2D body, and not through
   *  a joint.
   *
   *  // A function to set up the initialX, initialY, and initialAngle
   *  // properties of the next body part based on the body part
   *  // already added to the world. This should be defined as a
   *  // method on the joint object.
   *  // Assumes A is in the world, and B is not in the world.
   *  function setInitialBodyValues(attachA, attachB) {
   *    // See Body.WeldJoint for an example implementation
   *  }
   *
   *  // Detect the bodyPart not yet added to the world
   *  If A.body is not null and B.body is null:
   *    // the reference angle of the joint is applied to
   *    // the initial angle of B
   *    setInitialBodyValues(A, B)
   *  Else:
   *    Both body parts are already in the world, so assume that
   *    they are already placed as intended.
   * -----

   * world
   *  The Box2D world object that contains this body part.
   *  If world is null, it is assumed that addToWorld has not
   *  yet been called on this body part. This is important, because
   *  the addToWorld(world) function traverses the attachment graph and
   *  needs to avoid calling addToWorld(world) on body parts that have
   *  already been added. Remember to always set this.world in your
   *  overridden addToWorld(world) functions when your immediate
   *  superclass is the BodyPart abstract base class.

   * stage
   *  The PIXI Stage that renders the body part. If stage is null,
   *  it is assumed that addToStage has not yet been called on this
   *  body part. This is important for the same reasons as world.

   * groupIndex
   *  The index of the collision group for this object. This is used
   *  to set up collision filtering on fixtures during addToWorld.
   *  Two fixtures with the same negative groupIndex will never collide,
   *  but two fixtures with the same positive groupIndex will always collide.
   *  Setting collideConnected (true/false) on joint definitions can also affect
   *  whether connected bodies collide. collideConnected is false by default
   *  for most joints.

   * --------
   * Methods:
   * --------

   * data()
   *  Returns an array of objects containing
   *  the Box2D bodies and Pixi Graphics objhects subordinate
   *  to this body part by recursively calling data() on all
   *  subordinate body parts.
   *  A data object looks like this:
   *  {
   *    body: the Box2D body,
   *    graphics: the Pixi Graphics object
   *  }

   * attach (this_attach_index, other_bodyPart, other_attach_index)
   *  Attaches other_bodyPart to this body part at this_attach_index
   *  on this body part and this body part to other_bodyPart at
   *  other_attach_index on other_bodyPart by setting the appropriate
   *  references in each bodyPart's attachments array.

   * addToWorld (world)
   *  Adds this body part to the specified Box2D world by creating
   *  the necessary bodies using the world factory object.
   *  This abstract method should be overridden in a subclass.
   *  If you implement addToWorld(world) on a bodyPart represented
   *  by a joint in the Box2D world, you should first ensure that its
   *  attached body parts are added to the world, then create the joint using
   *  the Box2D bodies for those body parts, then add the joint to the world.

   * addToStage (stage, METER)
   *  Adds this body part to the specified Pixi stage by creating
   *  the necessary graphics objects and adding them to the stage.
   *  The pixel size of each graphics object is determined by
   *  multiplying the size of its corresponding Box2D body by METER.
   *  This abstract method should be overridden in a subclass.
   *  Like, addToWorld(world), addToStage(stage, METER) traverses
   *  the attachment graph to ensure all attached body parts are
   *  added to the stage.

   */

  Body.BodyPart = Class.extend({
    init: function (attachments, junctions, groupIndex) {
      this.attachments = attachments || [];
      this.junctions = junctions || [];
      if (typeof(groupIndex) === 'undefined') { groupIndex = 0; }

      this.initialX = null;
      this.initialY = null;
      this.initialAngle = 0;

      this.groupIndex = groupIndex;

      this.world = null;
      this.stage = null;
    }
  , attach: function (this_attach_index, other_bodyPart, other_attach_index) {
      var local = this.attachments[this_attach_index];
      var other = other_bodyPart.attachments[other_attach_index];

      // Set body part references.
      local.bodyPart = other_bodyPart;
      other.bodyPart = this;

      // Set complement references.
      local.complement = other;
      other.complement = local;
    }
  , addToWorld: function (world) { throw "Abstract method on superclass requires override."; }
  , addToStage: function (stage, METER) { throw "Abstract method on superclass requires override."; }
  , data: function () { throw "Abstract method on superclass requires override."; }
  });


// ----------------------------------------------------------------------------
// Default BodyParts: Joints
// Note: Any body part that attaches to a joint must have a .body
// property that contains a Box2D body.
// ----------------------------------------------------------------------------

  Body.WeldJoint = Body.BodyPart.extend({
    /*
    Attachmentsl
      0: bodyPartA,
      1: bodyPartB

    The initialJointData argument is an object containing information used
    to set up the joint, but every parameter is optional (defaults
    exist for all paraneters).
    Parameters you may wish to add to it include:
    - referenceAngle

      Note that attachment points on joints do not need anchor points.

      Also note that joints never need a groupIndex.


    */

    init: function (initialJointData) {
      if (typeof(initialJointData) === 'undefined') { initialJointData = {}; }
      var attachments = [
        {
          bodyPart: null
        , complement: null
        }
      , {
          bodyPart: null
        , complement: null
        }
        ];

      this._super(attachments);

      // Defaults
      this.initialJointData = {
        referenceAngle: 0
      };
      for (var key in initialJointData) {
        if (typeof(initialJointData[key]) !== 'undefined' ) { this.initialJointData[key] = initialJointData[key] };
      }

      this.joint = null; // Joint body parts have a Box2D "joint" instead of a "body".
    }
  , setInitialBodyValues: function (attachA, attachB) {
      // Assumes A is in the world and B is not.
      var A_anchor_world = attachA.bodyPart.body.GetWorldPoint(attachA.complement.anchorPoint);
      console.log("A_anchor_world");
      console.log(A_anchor_world);
      var A_angle = attachA.bodyPart.body.GetAngle();
      attachB.bodyPart.initialAngle = A_angle + this.initialJointData.referenceAngle;
      var B_anchor_rot = Utils.Box2D.b2Math.RotV( attachB.complement.anchorPoint, attachB.bodyPart.initialAngle );
      attachB.bodyPart.initialX = A_anchor_world.x - B_anchor_rot.x;
      attachB.bodyPart.initialY = A_anchor_world.y - B_anchor_rot.y;
    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }
      this.world = world;

      var attachA = this.attachments[0];
      var attachB = this.attachments[1];

      // Ensure both body parts attached to the joint are non-null
      // and that both are added to the world before proceeding,
      // but if one attachment point is empty, don't add the joint.
      // We MUST have a single Box2D body on each body part to connect the joint.

      // We do assume, however, that at least one of the body part's bodies is
      // in the world already
      if (attachA.bodyPart !== null && attachB.bodyPart !== null
        && attachA.complement !== null && attachB.complement !== null) {

        if (attachA.bodyPart.body !== null && attachB.bodyPart.body === null) {
          this.setInitialBodyValues(attachA, attachB);
          attachB.bodyPart.addToWorld(world);
        }
        else if (attachA.bodyPart.body === null && attachB.bodyPart.body !== null) {
          this.setInitialBodyValues(attachB, attachA);
          attachA.bodyPart.addToWorld(world);
        }

        // And now we may proceed.

        // Since the body parts should be positioned at the joint
        // already, we can use the standard Box2D way of initializing
        // a joint definition.
        var world_anchor = attachA.bodyPart.body.GetWorldPoint(attachA.complement.anchorPoint);
        var jointDef = new Box2D.Dynamics.Joints.b2WeldJointDef();
        jointDef.Initialize(attachA.bodyPart.body
                          , attachB.bodyPart.body
                          , world_anchor);
        jointDef.referenceAngle = this.initialJointData.referenceAngle;


        var joint = world.CreateJoint(jointDef);
        this.joint = joint;

      }

    }
  , addToStage: function (stage, METER) {
      if (this.stage != null) { return; }
      this.stage = stage;

      var attachA = this.attachments[0];
      var attachB = this.attachments[1];
      // As with addToWorld(world), both body parts must be properly
      // attached to this joint in order for us to allow traversal
      // of the attachment graph. Even though the complement attachments
      // are not strictly necessary for adding anything to the stage,
      // we requrie them anyway so it is immediately apparent that
      // something is wrong when supposedly connected body parts
      // don't show up in the renderer.
      if (attachA.bodyPart != null && attachB.bodyPart != null
        && attachA.complement != null && attachB.complement != null) {
        attachA.bodyPart.addToStage(stage, METER);
        attachB.bodyPart.addToStage(stage, METER);
        // TODO: For now, we don't add joints to the stage for rendering.
        //       We might choose to do so in the future, but it looks like
        //       the data to draw them needs to be derived from the attached
        //       Box2D bodies.
      }
    }
  , data: function () {
      throw "Joints do not contain render data.";
    }
  });


  Body.RevoluteJoint = Body.BodyPart.extend({
    /*
    Attachments:
      0: bodyPartA,
      1: bodyPartB

      Note that attachment points on joints do not need anchor points.
      Also note that joints never need a groupIndex.

    Junctions:
      0: Afferent, propagates a boolean indicating whether the joint motor is enabled.
      1: Efferent, if the impulse total is greater than or equal to 1 the motor is activated, otherwise it is deactivated.
      2: Afferent, propagates the speed of the motor
      3: Efferent, impulse total determines the speed of the motor.
      4: Afferent, propagates the torque of the motor
      5: Efferent, impulse total determines the max motor torque.

    The initialJointData argument is an object containing information used
    to set up the joint, but every parameter is optional (defaults
    exist for all paraneters).
    Parameters you may wish to add to it include:
    - enableMotor
    - motorSpeed
    - maxMotorTorque
    - referenceAngle
    */

    init: function (initialJointData) {
      if (typeof(initialJointData) === 'undefined') { initialJointData = {}; }

      var attachments = [
        {
          bodyPart: null
        , complement: null
        }
      , {
          bodyPart: null
        , complement: null
        }
      ];

      var junctions = [
        new Mind.AfferentJunction(this, function () {
          return this.bodyPart.joint.IsMotorEnabled();
        })
      , new Mind.EfferentJunction(this, function () {
          var sum = 0;
          this.impulseQueue.forEach(function (value) { sum += value; })
          this.bodyPart.joint.EnableMotor(sum >= 1.0);
        })
      , new Mind.AfferentJunction(this, function () {
          return this.bodyPart.joint.GetMotorSpeed();
        })
      , new Mind.EfferentJunction(this, function () {
          var sum = 0;
          this.impulseQueue.forEach(function (value) { sum += value; })
          this.bodyPart.joint.SetMotorSpeed(sum);
        })
      , new Mind.AfferentJunction(this, function () {
          return this.bodyPart.joint.GetMotorTorque();
        })
      , new Mind.EfferentJunction(this, function () {
          var sum = 0;
          this.impulseQueue.forEach(function (value) { sum += value; })
          this.bodyPart.joint.SetMaxMotorTorque(sum);
        })

      ];
      this._super(attachments, junctions);

      // Defaults
      this.initialJointData = {
        enableMotor: false
      , motorSpeed: 360 * Math.PI / 180
      , maxMotorTorque: 40
      , referenceAngle: 0
      };
      for (var key in initialJointData) {
        if (typeof(initialJointData[key]) !== 'undefined' ) { this.initialJointData[key] = initialJointData[key] };
      }

      this.joint = null; // Joint body parts have a Box2D "joint" instead of a "body".
    }
  , setInitialBodyValues: function (attachA, attachB) {
      // Assumes A is in the world and B is not.
      var A_anchor_world = attachA.bodyPart.body.GetWorldPoint(attachA.complement.anchorPoint);
      console.log("A_anchor_world");
      console.log(A_anchor_world);
      var A_angle = attachA.bodyPart.body.GetAngle();
      attachB.bodyPart.initialAngle = A_angle + this.initialJointData.referenceAngle;
      var B_anchor_rot = Utils.Box2D.b2Math.RotV( attachB.complement.anchorPoint, attachB.bodyPart.initialAngle );
      attachB.bodyPart.initialX = A_anchor_world.x - B_anchor_rot.x;
      attachB.bodyPart.initialY = A_anchor_world.y - B_anchor_rot.y;
    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }
      this.world = world;

      var attachA = this.attachments[0];
      var attachB = this.attachments[1];

      // Ensure both body parts attached to the joint are non-null
      // and that both are added to the world before proceeding,
      // but if one attachment point is empty, don't add the joint.
      // We MUST have a single Box2D body on each body part to connect the joint.
      if (attachA.bodyPart != null && attachB.bodyPart != null
        && attachA.complement != null && attachB.complement != null) {

         if (attachA.bodyPart.body !== null && attachB.bodyPart.body === null) {
            this.setInitialBodyValues(attachA, attachB);
            attachB.bodyPart.addToWorld(world);
          }
          else if (attachA.bodyPart.body === null && attachB.bodyPart.body !== null) {
            this.setInitialBodyValues(attachB, attachA);
            attachA.bodyPart.addToWorld(world);
          }

          // And now we may proceed.

          // Since the body parts should be positioned at the joint
          // already, we can use the standard Box2D way of initializing
          // a joint definition.
          var world_anchor = attachA.bodyPart.body.GetWorldPoint(attachA.complement.anchorPoint);

          var jointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
          jointDef.Initialize(attachA.bodyPart.body
                            , attachB.bodyPart.body
                            , world_anchor);
          jointDef.referenceAngle = this.initialJointData.referenceAngle;

          jointDef.enableMotor = this.initialJointData.enableMotor;
          jointDef.motorSpeed = this.initialJointData.motorSpeed;
          jointDef.maxMotorTorque = this.initialJointData.maxMotorTorque;


          var joint = world.CreateJoint(jointDef);
          this.joint = joint;

      }

    }
  , addToStage: function (stage, METER) {
      if (this.stage != null) { return; }
      this.stage = stage;

      var attachA = this.attachments[0];
      var attachB = this.attachments[1];
      // As with addToWorld(world), both body parts must be properly
      // attached to this joint in order for us to allow traversal
      // of the attachment graph. Even though the complement attachments
      // are not strictly necessary for adding anything to the stage,
      // we requrie them anyway so it is immediately apparent that
      // something is wrong when supposedly connected body parts
      // don't show up in the renderer.
      if (attachA.bodyPart != null && attachB.bodyPart != null
        && attachA.complement != null && attachB.complement != null) {
        attachA.bodyPart.addToStage(stage, METER);
        attachB.bodyPart.addToStage(stage, METER);
        // TODO: For now, we don't add joints to the stage for rendering.
        //       We might choose to do so in the future, but it looks like
        //       the data to draw them needs to be derived from the attached
        //       Box2D bodies.
      }
    }
  , data: function () {
      throw "Joints do not contain render data.";
    }
  });



// ----------------------------------------------------------------------------
// Default BodyParts: Common Appendages
// ----------------------------------------------------------------------------

  Body.Wheel = Body.BodyPart.extend({
    init: function (radius, initialAngle, groupIndex) {
      if (typeof(initialAngle) === 'undefined') { initialAngle = 0; }
      /*
        The wheel has a single attachment point at its center.
      */
      var b2Vec2 = Box2D.Common.Math.b2Vec2;
      var attachments = [{
          anchorPoint: new b2Vec2(0, 0)
        , bodyPart:    null
        , complement: null
        }];
      this._super(attachments, [], groupIndex);

      this.radius = radius;
      this.initialAngle = initialAngle;

      this.body = null;
      this.graphics = null;
    }
  , addToWorld: function (world) {
    console.log("wheel add to world");
      if (this.world != null) { return; }

      this.world = world;

      var bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

      var circleFixture = new Box2D.Dynamics.b2FixtureDef();
      circleFixture.shape = new Box2D.Collision.Shapes.b2CircleShape();
      circleFixture.density = 1;
      circleFixture.friction = 0.7;
      circleFixture.shape.SetRadius(this.radius)
      circleFixture.filter.groupIndex = this.groupIndex;

      var body = world.CreateBody(bodyDef);
      body.CreateFixture(circleFixture);

      // this.initialX = 3;
      // this.initialY = 3;
      if (this.initialX !== null && this.initialY !== null) {
        var pos = new Box2D.Common.Math.b2Vec2(this.initialX, this.initialY);
        body.SetPosition(pos);
      }
      body.SetAngle(this.initialAngle);

      this.body = body;



      // Add any not-yet-added attached body parts to the world as well.
      this.attachments.forEach(function (attachment) {
        if (attachment.bodyPart != null) {
          attachment.bodyPart.addToWorld(world);
        }
      });
    }
  , addToStage: function (stage, METER) {
      if (this.stage != null) { return; }
      this.stage = stage;

      var graphics = new PIXI.Graphics();

      // Fill
      graphics.beginFill(0xFFCCFF, 1);
      graphics.drawCircle(0, 0, this.radius * METER);
      graphics.endFill();

      this.graphics = graphics;

      stage.addChild(graphics);

      // Add any not-yet-added attached body parts to the stage as well.
      this.attachments.forEach(function (attachment) {
        if (attachment.bodyPart != null) {
          attachment.bodyPart.addToStage(stage, METER);
        }
      });
    }
  , data: function () {
      return [{
        body: this.body
      , graphics: this.graphics
      }];
    }
  });


// ----------------------------------------------------------------------------
// Default BodyParts: Torsos
// ----------------------------------------------------------------------------

  /*
    The variables initialX and initialY are the initial coordinates
    when this body part is added to the Box2D world. For now, I think
    itt is a good idea to do this on a single body part on your creature
    so it can be placed appropriately.
  */

  Body.BoxTorso = Body.BodyPart.extend({
    init: function (initialX, initialY, width, height, initialAngle, groupIndex) {
      if (typeof(initialAngle) === 'undefined') { initialAngle = 0; }
      /*
        The BoxTorso has attachment points at each corner and
        at the midpoints of each side.

        The attachment indices proceed clockwise from the top-left corner:
        0: Top-Left Corner
        1: Top Midpoint
        2: Top-Right Corner
        3: Right Midpoint
        4: Bottom-Right Corner
        5: Bottom Midpoint
        6: Bottom-Left Corner
        7: Left Midpoint

        As far as I can tell, the Y-Axis points down for a Box2D
        body's local coordinates.

      */
      var b2Vec2 = Box2D.Common.Math.b2Vec2;
      var attachments = [
        {
          anchorPoint: new b2Vec2(-width/2, -height/2) // Top-Left Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(0, -height/2) // Top Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(width/2, -height/2) // Top-Right Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(width/2, 0) // Right Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(width/2, height/2) // Bottom-Right Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(0, height/2) // Bottom Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(-width/2, height/2) // Bottom-Left Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(-width/2, 0) // Left Midpoint
        , bodyPart:    null
        , complement: null
        }
      ];

      // Note: There is nothing to control on this torso, so it has no junctions.
      this._super(attachments, [], groupIndex);

      this.initialX = initialX;
      this.initialY = initialY;
      this.initialAngle = initialAngle;

      this.width = width;
      this.height = height;

      this.body = null;
      this.graphics = null;

    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }

      this.world = world;

      var bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

      var polyFixture = new Box2D.Dynamics.b2FixtureDef();
      polyFixture.shape = new Box2D.Collision.Shapes.b2PolygonShape();
      polyFixture.density = 1;
      polyFixture.friction = 0.01;
      polyFixture.shape.SetAsBox(this.width/2, this.height/2);
      polyFixture.filter.groupIndex = this.groupIndex;

      var body = world.CreateBody(bodyDef);
      body.CreateFixture(polyFixture);

      var pos = new Box2D.Common.Math.b2Vec2(this.initialX, this.initialY);
      body.SetPosition(pos);
      body.SetAngle(this.initialAngle);

      this.body = body;

      // Add any not-yet-added attached body parts to the world as well.
      this.attachments.forEach(function (attachment) {
        if (attachment.bodyPart != null) {
          attachment.bodyPart.addToWorld(world);
        }
      });

    }
  , addToStage: function (stage, METER) {
      if (this.stage != null) { return; }
      this.stage = stage;

      var graphics = new PIXI.Graphics();

      // Fill
      graphics.beginFill(0xFFCCFF, 1);
      graphics.drawRect(0, 0, this.width * METER, this.height * METER);
      graphics.endFill();

      // Center Pivot
      graphics.pivot = new PIXI.Point(this.width * METER/2, this.height * METER/2);

      this.graphics = graphics;

      stage.addChild(graphics);

      // Add any not-yet-added attached body parts to the stage as well.
      this.attachments.forEach(function (attachment) {
        if (attachment.bodyPart != null) {
          attachment.bodyPart.addToStage(stage, METER);
        }
      });
    }
  , data: function () {
      return [{
        body: this.body
      , graphics: this.graphics
      }];
    }
  });


  return Body;
});