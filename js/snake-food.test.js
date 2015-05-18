'use strict';

var Bacon = require('baconjs');
var snakeAndFood = require('./snake-food.js');

describe('snake and food properties', function() {
  var head$;
  var gameStart$;
  var food$$;
  var snake$$;

  beforeEach(function() {
    head$ = new Bacon.Bus();
    gameStart$ = new Bacon.Bus();
    var sf = snakeAndFood(head$, gameStart$);
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
         expect(snake).to.be.null;
         expect(food).to.be.null;
       });

    describe('gameStart$ and head$ eventStreams get initial values', function(){
      beforeEach(function(){
        gameStart$.push(Date.now());
        head$.push(initialHeadPosition);
      });

      it('snake should have one position equal to the initial head', function(){
        expect(snake).not.to.be.null;
        expect(snake).to.have.property('size').equal(1);
        expect(snake.get(0)).to.deep.equal(initialHeadPosition);
      });

      it('food should have a value different from the initial head', function(){
        expect(food).not.to.be.null;
        expect(food).to.have.property('x')
                            .to.be.a('number')
                            .not.equal(initialHeadPosition.x);
        expect(food).to.have.property('y')
                            .to.be.a('number')
                            .not.equal(initialHeadPosition.y);
        });
      });
  });
});
