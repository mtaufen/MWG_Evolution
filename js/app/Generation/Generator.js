"use strict";
define([
    "lib/Utils"
  , "lib/Class"
  , "app/Creature"
  , "app/Body"
  , "app/Wall" ], function (Utils, Class, Creature, Body, Wall) {
  	var Generator=Class.extend({
      CombineTraits: function(Trait1, Trait2){
        return Utils.Math.randRange(Trait1, Trait2);
      }
  	,	Generate1: function(parentA, parentB, mutationRate, mutationSize, targetWall){
  			if ( typeof(mutationRate) === 'undefined' ) { mutationRate = 0; }
  			if ( typeof(mutationSize) === 'undefined' ) { mutationSize = 1; }

  			var AData=parentA.props;
  			var BData=parentB.props;
  			var CData=Utils.Data.copyThing(AData);
  			for(var prop in BData) {
  				for(var key in BData[prop]) { // Important: AData and BData should have the same property types contained in them.
            if (Math.random() < 0.5) {
              CData[prop][key] = BData[prop][key];
            }
          }
        }
        var Child = new Creature.Scorpion(CData, targetWall);
        return Child;
  		}






  	});
    return Generator;
  });


