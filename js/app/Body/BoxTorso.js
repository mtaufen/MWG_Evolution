"use strict";
define([ "app/Body/BodyPart"
       , "lib/Box2dWeb_dev"
       , "lib/pixi"
       ], function (BodyPart, Box2D, PIXI) {

        /*
          Default data options:
          initialX     (default: 4)
          initialY     (default: 10)
          initialAngle (default: 0)
          width        (default: 4)
          height       (default: 1)
          density      (default: 1)
          friction     (default: 0.01)
        */

  var BoxTorso = BodyPart.extend({
    init: function (data, groupIndex) {
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

      // Initialize properties:
      if ( typeof(data) === 'undefined' ) { data = {}; }
      this.props = {
        initialX: 4
      , initialY: 10
      , initialAngle: 0
      , width: 4
      , height: 1
      , density: 1
      , friction: 0.01
      };

      for (var key in data) {
        if (typeof(data[key]) !== 'undefined' ) { this.props[key] = data[key] };
      }



      var b2Vec2 = Box2D.Common.Math.b2Vec2;
      var attachments = [
        {
          anchorPoint: new b2Vec2(-this.props.width/2, -this.props.height/2) // Top-Left Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(0, -this.props.height/2) // Top Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(this.props.width/2, -this.props.height/2) // Top-Right Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(this.props.width/2, 0) // Right Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(this.props.width/2, this.props.height/2) // Bottom-Right Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(0, this.props.height/2) // Bottom Midpoint
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(-this.props.width/2, this.props.height/2) // Bottom-Left Corner
        , bodyPart:    null
        , complement: null
        }
      , {
          anchorPoint: new b2Vec2(-this.props.width/2, 0) // Left Midpoint
        , bodyPart:    null
        , complement: null
        }
      ];

      // Note: There is nothing to control on this torso, so it has no junctions.
      this._super(attachments, [], groupIndex);


      this.initialX = this.props.initialX;
      this.initialY = this.props.initialY;
      this.initialAngle = this.props.initialAngle;

      this.body = null;
      this.graphics = null;

      this.name = "BoxTorso";
    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }

      this.world = world;

      var bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

      var polyFixture = new Box2D.Dynamics.b2FixtureDef();
      polyFixture.shape = new Box2D.Collision.Shapes.b2PolygonShape();
      polyFixture.density = this.props.density;
      polyFixture.friction = this.props.friction;
      polyFixture.shape.SetAsBox(this.props.width/2, this.props.height/2);
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

      // Draw variables:

      // Base fill:
      graphics.beginFill(0x4B5320, 1);
      graphics.drawRect(0, 0, this.props.width * METER, this.props.height * METER);
      graphics.endFill();

      // Center Pivot
      graphics.pivot = new PIXI.Point(this.props.width * METER/2, this.props.height * METER/2);

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
        type: "BoxTorso"
      , body: this.body
      , graphics: this.graphics
      }];
    }
  });

  return BoxTorso;

});