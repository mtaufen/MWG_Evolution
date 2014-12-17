"use strict";
define([
  , "app/Creature/Scorpion"
  , "app/Body"
  , "lib/Utils" ], function (Scorpion, Body) {
  	var Generator=Class.extend({
  		Generate1: function(parentA, parentB, mutationRate, mutationSize){
  			if ( typeof(mutationRate) === 'undefined' ) { mutationRate = 0; }
  			if ( typeof(mutationSize) === 'undefined' ) { mutationSize = 1; }

  			var AData=parentA.props;
  			var BData=parentB.props;
  			var CData;
  			for(var prop in AData)
  				CData[prop]=

  		}






  	});

  });