"use strict";
define([
    "lib/Utils"
  , "lib/Class"
  , "app/Creature"
  , "app/Body"
  , "app/Wall" ], function (Utils, Class, Creature, Body, Wall) {
  	var Generator=Class.extend({
      init: function(mRate){
        if ( typeof(mRate) === 'undefined' ) { mRate = 0; }
        this.mutationRate=mRate;
      }
    , GenerateRandData: function(num){
        var NData=[];
        for (var i=0; i<num; i++){
          var TData = {
            torsoData:  {
                initialX: 4
                , initialY: 10
                , initialAngle: 0
                , width: Utils.Math.randRange(1,5)
                , height: Utils.Math.randRange(.1,2)
                , density: 1
                , friction: 0.01
            }

            , leftWheelData: {
              radius: Utils.Math.randRange(.1,2)
              , density: 2
              , friction: 0.1
          }

          , leftWheelJointData: {
              enableMotor: true
              , motorSpeed: Utils.Math.randRange(1,20)
              , maxMotorTorque: 75
          }

          , rightWheelData: {
              friction: 0.01
          }

          , rightWheelJointData: {
              enableMotor: true
              , motorSpeed: -6
              , maxMotorTorque: 10
          }

          , tailData: {
              numVertebrae: 10
              , rootWidth: 0.2
              , rootHeight: 1
              , rootDensity: 1
              , rootMaxTorque: 75000
              , widthReductionFactor: 1
              , heightReductionFactor: 1
              , densityReductionFactor: 1
              , torqueReductionFactor: 1
              , friction: 0.5
          }

          , tailNeuronData: {

          }
        };
        NData.push(Utils.Data.copyThing(TData));
      }
      return NData;
    }
  	,	Generate1: function(parentA, parentB, mutationRate){
  			if ( typeof(mutationRate) === 'undefined' ) { mutationRate = 0; }

  			var AData=parentA.props;
  			var BData=parentB.props;
  			var CData=Utils.Data.copyThing(AData);
  			for(var prop in BData) {
  				for(var key in BData[prop]) { // Important: AData and BData should have the same property types contained in them.
            if (Math.random() < 0.5) {
              CData[prop][key] = BData[prop][key];
            }
            if (Math.random()<mutationRate && typeof(CData[prop][key])==="number"){
              //console.log("mutation");
              CData[prop][key] = Utils.Math.randRange(AData[prop][key], BData[prop][key]);
            }
          }
        }
        return CData;
  		}
    , 




  	});
    return Generator;
  });


