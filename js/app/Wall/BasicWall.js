"use strict";
define([
        "app/Body/BodyPart"
      , "app/Mind"

      , "lib/Class"
      , "lib/Box2dWeb_dev"
      , "lib/pixi"
       ], function (BodyPart, Mind, Class, Box2D, PIXI) {

  var BasicWall = Class.extend({
    init: function (initialX, initialY, width, height) {

      this.initialX = initialX;
      this.initialY = initialY;
      this.width    = width;
      this.height   = height;

      this.world = null;
      this.body = null;

      this.stage = null;
      this.graphics = null;


    }
  , addToWorld: function (world) {
      if (this.world != null) { return; }
      this.world = world;

      var bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;

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
    }
  , data: function () {
      return [{
        body: this.body
      , graphics: this.graphics
      }];
    }
  });

  return BasicWall;

});