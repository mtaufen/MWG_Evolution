"use strict";
define(["lib/Box2dWeb_dev", "lib/pixi", "lib/Class", "app/Mind"], function (Box2D, PIXI, Class, Mind) {

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

   * -----
   *  The initial position and angle values are applied to the Box2D body
   *  immediately after the Box2D body is added to the Box2D world.
   *  They are null (or 0, in the case of initialAngle) by default,
   *  but if set, certain joints will try to use them to extrapolate the
   *  positions of connected body parts.
   *  The extrapolation process is described below in general for a
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
   *  // already added to the world. This should be defined inside
   *  // the scope of the addToWorld method on a given joint,
   *  // so that joints can be flexible with how they position
   *  // attached body parts and so that it can access the defaults
   *  // defined for that joint. You should use .bind() when you call
   *  // it to ensure that `this` is set to the calling body part that
   *  // represents a joint.
   *  // Assumes A is in the world, and B is not in the world.
   *  function SetUpInitialValues(A, A_attachment
   *                            , B, B_attachment) {
   *    v = A.body.GetWorldVector(A_attachment.anchorPoint)
   *    B.initialAngle = nextPart.initialAngle + J.initialReferenceAngle
   *    B_anchor_rot = B_attachment.anchorPoint
   *    B.initialX = v.x -
   *  }
   *
   *  // Detect the bodyPart not yet added to the world
   *  If A.body is not null and B.body is null:
   *    // the reference angle of the joint is applied to
   *    // the initial angle of B
   *    B.initialAngle = B.initialAngle + J.referenceAngle
   *    // the location of
   *  Else:
   *    Both joints are already in the world, so assume that
   *    they are already placed as intended and just create
   *    the joint.
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

   // NOTE: Will have to make sure we don't backtrack wrong when
      //       traversing the tree of attachments while building the organsim.
      // We'll need to pick the right graph traversal algorithm for adding
      // the body part to the world/renderer.


   */

  Body.BodyPart = Class.extend({
    init: function (attachments, junctions, groupIndex) {
      this.attachments = attachments || [];
      this.junctions = junctions || [];
      if (typeof(groupIndex) === 'undefined') { groupIndex = 0; }

      this.world = null;
      this.stage = null;
      this.groupIndex = groupIndex;
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
      0: bodyPartA,
      1: bodyPartB

      Note that attachment points on joints do not need anchor points.

      Also note that joints never need a groupIndex.
    */

    init: function () {
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

      this.joint = null; // Joint body parts have a Box2D "joint" instead of a "body".
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

        attachA.bodyPart.addToWorld(world);
        attachB.bodyPart.addToWorld(world);
        // And now we may proceed.

        var jointDef = new Box2D.Dynamics.Joints.b2WeldJointDef();
        jointDef.bodyA = attachA.bodyPart.body;
        jointDef.bodyB = attachB.bodyPart.body;
        jointDef.localAnchorA = attachA.complement.anchorPoint;
        jointDef.localAnchorB = attachB.complement.anchorPoint;

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

    */

    init: function (defaultEnableMotor, defaultMotorSpeed, defaultMaxMotorTorque) {
      if (typeof defaultEnableMotor === 'undefined') { defaultEnableMotor = false; }
      if (typeof defaultMotorSpeed === 'undefined') { defaultMotorSpeed = 360 * Math.PI / 180; } // 1 rev / second
      if (typeof defaultMaxMotorTorque === 'undefined') { defaultMaxMotorTorque = 2000; }


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

      this.joint = null; // Joint body parts have a Box2D "joint" instead of a "body".
      this.defaultEnableMotor = defaultEnableMotor;
      this.defaultMotorSpeed = defaultMotorSpeed;
      this.defaultMaxMotorTorque = defaultMaxMotorTorque;
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

        attachA.bodyPart.addToWorld(world);
        attachB.bodyPart.addToWorld(world);
        // And now we may proceed.

        var jointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        jointDef.bodyA = attachA.bodyPart.body;
        jointDef.bodyB = attachB.bodyPart.body;
        jointDef.localAnchorA = attachA.complement.anchorPoint;
        jointDef.localAnchorB = attachB.complement.anchorPoint;

        jointDef.enableMotor = this.defaultEnableMotor;
        jointDef.motorSpeed = this.defaultMotorSpeed;
        jointDef.maxMotorTorque = this.defaultMaxMotorTorque;

        var joint = world.CreateJoint(jointDef);
        this.joint = joint;

        console.log(joint);

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


  // TODO: THIS CLASS IS UNFINISHED
  Body.WheelJoint = Body.BodyPart.extend({
    // I ported the Box2D wheel joint into our copy of Box2DWeb
    // from a newer version of Box2D C++. -- Mike

    /*
      The wheel joint has two attachments, one for the top
      body and one for the bottom body. The axis of the joint
      is always defined in terms of the top body (this makes sense
      if you think of a wheel joint as the suspension of the car,
      where the axis of the joint would be defined
      in terms of the chassis).

      0: topBodyPart,
      1: bottomBodyPart

      Note that attachment points on joints do not need anchor points.
    */

    init: function (axis) {
      var b2Vec2 = Box2D.Common.Math.b2Vec2;
      axis = axis || new b2Vec2(1.0, 0.0); // default

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
      var junctions = [];
      this._super(attachments, junctions);

      this.axis = axis;
      this.joint = null; // Joint body parts have a Box2D "joint" instead of a "body".
    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }
      this.world = world;

      var topAttach = this.attachments[0];
      var bottomAttach = this.attachments[1];

      // Ensure both body parts attached to the joint are non-null
      // and that both are added to the world before proceeding,
      // but if one attachment point is empty, don't add the joint.
      // We MUST have a single Box2D body on each body part to connect the joint.
      if (topAttach.bodyPart != null && bottomAttach.bodyPart != null
        && topAttach.complement != null && bottomAttach.complement != null) {

        topAttach.bodyPart.addToWorld(world);
        bottomAttach.bodyPart.addToWorld(world);
        // And now we may proceed.

        var jointDef = new Box2D.Dynamics.Joints.b2WheelJointDef();

        jointDef.bodyA = topAttach.bodyPart.body;
        jointDef.bodyB = bottomAttach.bodyPart.body;
        jointDef.localAnchorA = topAttach.complement.anchorPoint;
        jointDef.localAnchorB = bottomAttach.complement.anchorPoint;
        jointDef.localAxisA = topAttach.bodyPart.body.GetLocalVector(this.axis);

        //jointDef.frequencyHz = 0.0;
        //jointDef.dampingRatio = 1.0;

        var joint = world.CreateJoint(jointDef);

        this.joint = joint;


      }

    }
  , addToStage: function (stage, METER) {
      if (this.stage != null) { return; }
      this.stage = stage;

      var topAttach = this.attachments[0];
      var bottomAttach = this.attachments[1];
      // As with addToWorld(world), both body parts must be properly
      // attached to this joint in order for us to allow traversal
      // of the attachment graph. Even though the complement attachments
      // are not strictly necessary for adding anything to the stage,
      // we requrie them anyway so it is immediately apparent that
      // something is wrong when supposedly connected body parts
      // don't show up in the renderer.
      if (topAttach.bodyPart != null && bottomAttach.bodyPart != null
        && topAttach.complement != null && bottomAttach.complement != null) {
        topAttach.bodyPart.addToStage(stage, METER);
        topAttach.bodyPart.addToStage(stage, METER);
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
    init: function (radius, groupIndex) {
      if (typeof(groupIndex) === 'undefined') { groupIndex = 0; }
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

      this.body = null;
      this.graphics = null;
    }
  , addToWorld: function (world) {
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

      // Center Pivot
      //graphics.pivot = new PIXI.Point(this.width * METER/2, this.height * METER/2);

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
    init: function (initialX, initialY, width, height, groupIndex) {
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