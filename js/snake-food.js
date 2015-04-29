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

function snakeAndFood(direction$, ticks$, gameStart$){
  var direction$$ = direction$.toProperty();

  //the position of the head of the snake
  var head$ = Bacon.update(
    null,
    [gameStart$], R.nAry(0, R.partial(getAvailablePosition, [])),
    [direction$, ticks$], helpers.getNextHeadPosition,
    [direction$$, ticks$], helpers.getNextHeadPosition
  )
  .skipDuplicates()
  .changes();

  //this is actually a 'stepper' of the food that gets eaten by the snake
  var eatenFood$ = new Bacon.Bus();

  //after the snake eats, its length will increase in the next X movements.
  //Therefore we need to keep a buffer that indicates how much more the snake
  //is supposed to grow. The buffer will decrease as the snake moves and
  //it will increase every time the snake eats
  var growthBuffer$$ = Bacon.update(
    0-(config.FOOD_INCREASE+1),
    [head$, gameStart$], R.always(0-(config.FOOD_INCREASE+1)),
    [eatenFood$], R.add(config.FOOD_INCREASE+1),
    [head$], R.cond([R.gt(1), R.identity], [R.T, R.dec])
  ).skipDuplicates();

  //The current length of the snake
  var length$$ = Bacon.update(
    1,
    [head$, gameStart$], R.always(1),
    [growthBuffer$$, head$], R.flip(increaseIfBufferIsNotEmpty)
  ).skipDuplicates();

  //the latest "length$$" positions where the head of the snake has passed
  //through. In other words: the positions of the full body of the snake
  //(including its head)
  var snake$$ = Bacon.update(
    null,
    [head$, gameStart$], function(old, head){return Immutable.List.of(head);},
    [head$, length$$], function(old, head, len){
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  );

  //the position of food
  var food$$ = Bacon.update(
    null,
    [snake$$, head$, gameStart$], function(old, snake){
                                   return getAvailablePosition(snake.toArray());
    },
    [head$, snake$$], function(food, head, snake){
      return R.eqDeep(food, head) ?
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
