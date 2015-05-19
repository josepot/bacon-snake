'use strict';

var Bacon = require('baconjs');
var signals = require('./signals.js');
var R = require('ramda');
var config = require('./config.js');

describe('snake and food properties', function() {
  var head$;
  var gameStart$;
  var food$$;
  var snake$$;

  beforeEach(function() {
    head$ = new Bacon.Bus();
    gameStart$ = new Bacon.Bus();
    var sf = signals.getSnakeAndFood$$(head$, gameStart$);
    food$$ = sf.food$$;
    snake$$ = sf.snake$$;
  });

  it('should be Bacon Properties', function() {
    expect(food$$).to.be.an.instanceOf(Bacon.Property);
    expect(snake$$).to.be.an.instanceOf(Bacon.Property);
  });

  describe('game start', function() {
    var snake, food, initialHeadPosition;
    beforeEach(function(){
      initialHeadPosition = {x:0, y:0};
      snake$$.onValue(function(val) { snake = val; });
      food$$.onValue(function(val) { food = val; });
    });

    it('shouldnt trigger a change before gameStart and head streams start',
       function() {
         expect(snake).to.not.exist;
         expect(food).to.not.exist;
       });

    describe('gameStart$ and head$ eventStreams get initial values', function(){
      beforeEach(function(){
        gameStart$.push(Date.now());
        head$.push(initialHeadPosition);
      });

      it('snake should have just one position: the initial head', function() {
        expect(snake).not.to.be.null;
        expect(snake).to.have.property('size').equal(1);
        expect(snake.get(0)).to.deep.equal(initialHeadPosition);
      });

      it('food should have a value different from the initial head', function(){
        expect(food).not.to.be.null;
        expect(food).to.have.property('x')
                            .to.be.a('number');
        expect(food).to.have.property('y')
                            .to.be.a('number');
        expect(food).not.to.deep.equal(initialHeadPosition);
      });
      describe('head$ moves towards food', function(){
        var firstFoodPosition, positionBeforeFood;

        beforeEach(function(){
          firstFoodPosition = R.clone(food);
          //we move the head$ until the position before the food
          var x, y;
          for(x = 0; x < food.x; x++) {
            head$.push({y:0, x:x});
          }
          for(y = 0; y < food.y; y++) {
            head$.push({y:y, x:x - 1});
          }
          positionBeforeFood = food.x > 0 ?
            {x: x, y: y - 1} :
            {x: x - 1, y: y};
          head$.push(positionBeforeFood);
        });

        it('food position should still be the original', function() {
          expect(food).to.deep.equal(firstFoodPosition);
        });

        it('snake should have just one position', function(){
          expect(snake).not.to.be.null;
          expect(snake).to.have.property('size').equal(1);
          expect(snake.get(0)).to.deep.equal(positionBeforeFood);
        });

        describe('head$ hits food$', function(){
          beforeEach(function(){
            head$.push(food);
          });

          it('food position should be different from the original', function() {
            expect(food).not.to.deep.equal(firstFoodPosition);
          });

          it('snake length should still be 1', function() {
            expect(snake).to.have.property('size').equal(1);
            expect(snake.get(0)).to.deep.equal(firstFoodPosition);
          });

          it('snake length should increase after the next changes', function() {
            for(var i = 1; i<= config.FOOD_INCREASE; i++){
              head$.push(R.evolve({x: R.add(i)}, firstFoodPosition));
              expect(snake).to.have.property('size').equal(i + 1);
            }
            head$.push(R.evolve({x: R.add(i)}, firstFoodPosition));
            expect(snake).to.have.property('size').equal(i);
          });

          it('should stop increasing after FOOD_INCREASE changes', function() {
            for(var i = 1; i<= config.FOOD_INCREASE + 1; i++){
              head$.push(R.evolve({x: R.add(i)}, firstFoodPosition));
            }
            expect(snake).to.have.property('size')
                                 .equal(config.FOOD_INCREASE + 1);
          });
        });
      });
    });
  });
});
