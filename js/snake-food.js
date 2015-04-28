var Bacon = require('baconjs');
var Immutable = require('immutable');
var R = require('ramda');
var constants = require('./constants.js');
var config = require('./config.js');
var helpers = require('./helpers.js');

var getAvailablePosition =
  R.partialRight(helpers.getAvailablePosition, config.COLS, config.ROWS);
var decreaseUntilZero = R.pipe(R.dec, R.curryN(2, Math.max)(0));
var increaseIfBufferIsNotEmpty = R.cond(
  [R.gt(1), R.nthArg(1)],
  [R.T, R.pipe(R.nthArg(1),R.add(1))]
);

function snakeAndFood(head$, gameEnd$){
  //this is actually a 'stepper' of the food that gets eaten by the snake
  var eatenFood$ = new Bacon.Bus();

  //after the snake eats, its length will increase in the next X movements.
  //Therefore we need to keep a buffer that indicates how much more the snake
  //is supposed to grow. The buffer will decrease as the snake moves and
  //it will increase every time the snake eats
  var growthBuffer$$ = Bacon.update(
    0-(config.FOOD_INCREASE+1),
    [gameEnd$], R.always(0-(config.FOOD_INCREASE+1)),
    [eatenFood$], R.add(config.FOOD_INCREASE+1),
    [head$], function(old){return old<1?old:old-1;}
  ).skipDuplicates();

  //The current length of the snake
  var length$$ = Bacon.update(
    1,
    [gameEnd$], R.always(1),
    [growthBuffer$$, head$], R.flip(increaseIfBufferIsNotEmpty)
  ).skipDuplicates();

  //the latest "length$$" positions where the head of the snake has passed
  //through. In other words: the positions of the full body of the snake
  //(including its head)
  var snake$$ = Bacon.update(
    null,
    [gameEnd$], R.always(null),
    [head$, length$$], function(old, head, len){
      if(R.isNil(old)) return Immutable.List.of(head);
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  );

  //the position of food
  var food$$ = Bacon.update(
    null,
    [gameEnd$], R.always(null),
    [head$, snake$$], function(food, head, snake){
      return R.isNil(food) || R.eqDeep(food, head) ?
              getAvailablePosition(snake.toArray()) :
              food;
    }
  ).skipDuplicates();

  //if the food changes that means that the snake has eaten,
  //therefore we need to plug these changes to 'eatenFood$'
  eatenFood$.plug(food$$.changes().filter(R.pipe(R.isNil,R.not)));

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = snakeAndFood;
