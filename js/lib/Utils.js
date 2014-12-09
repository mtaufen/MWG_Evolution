// Utility functions
define(["lib/Box2dWeb_dev"], function (Box2D) {
  var Utils = {};

  Utils.Box2D = {};
  Utils.Box2D.b2Math = {};

  Utils.Box2D.b2Math.RotV = function (v, a) {
    var b2Vec2 = Box2D.Box2D.Common.Math.b2Vec2;
    var c = Math.cos(a);
    var s = Math.sin(a);
    return new b2Vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  return Utils;
});