define(["lib/Box2dWeb", "lib/pixi"], function (Box2D, PIXI) {

  var _METER_LENGTH = 10;

  // Class level variables, treat these as const.
  var bodyDef = new Box2D.Dynamics.b2BodyDef();
  bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

  var polyFixture = new Box2D.Dynamics.b2FixtureDef();
  polyFixture.shape = new Box2D.Collision.Shapes.b2PolygonShape();
  polyFixture.density = 1;
  polyFixture.friction = 0.01;

  // Constructor:
  var PhysicsBox = function(width, height) {
    this._width = width;
    this._height = height;
    this.body = null; // Created when the PhysicsBox is added to a world

    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0xFF0000, 1); // red fill color
    this.graphics.drawRect(0, 0, width*_METER_LENGTH, height*_METER_LENGTH);
    this.graphics.endFill();

    this.graphics.pivot = new PIXI.Point(width*_METER_LENGTH / 2, height*_METER_LENGTH / 2);

  }

  // Static Methods:
  PhysicsBox.SetMeterLength = function (METER_LENGTH) {
    _METER_LENGTH = METER_LENGTH;
  }


  // Instance Methods:
  PhysicsBox.prototype.addToB2World = function (x, y, world) {
    var body = world.CreateBody(bodyDef);
    polyFixture.shape.SetAsBox(this._width / 2, this._height / 2);
    body.CreateFixture(polyFixture);

    var pos = new Box2D.Common.Math.b2Vec2(x, y);
    body.SetPosition(pos);

    this.body = body;
  }

  PhysicsBox.prototype.addToPIXIStage = function (stage) {
    stage.addChild(this.graphics);
  }

/*
  // Might implement this to refresh the physics body
  // if I add the ability to change the width and height
  // of the box on the fly
  PhysicsBox.prototype.refreshBody = function () {
    // TODO
  }
*/

  // Called to update the location and of the graphics object based on the
  // properties of the physics body.
  PhysicsBox.prototype.update = function () {
    if (this.body) {
      var pos = this.body.GetPosition();
      this.graphics.position.x = pos.x * _METER_LENGTH;
      this.graphics.position.y = pos.y * _METER_LENGTH;
      this.graphics.rotation = this.body.GetAngle();
    }
  }

  return PhysicsBox;
});