var Bacon = require('baconjs');
var Immutable = require('immutable');
var R = require('ramda');
var constants = require('./constants.js');
var config = require('./config.js');
var helpers = require('./helpers.js');

var getAvailablePosition =
  R.partialRight(helpers.getAvailablePosition, config.COLS, config.ROWS);
function getNextHeadPosition(prev, direction, ticks){
  if(R.isNil(direction)) return prev;
  return R.evolve(
    R.mapObj(R.add, constants.DIRECTIONS_MUTATIONS[direction]),
    prev
  );
}
var decreaseUntilZero = R.pipe(R.dec, R.curryN(2, Math.max)(0));
var increaseIfBufferIsNotEmpty = R.cond(
  [R.eq(0), R.nthArg(1)],
  [R.T, R.pipe(R.nthArg(1),R.add(1))]
);

function snakeAndFood(ticks$, direction$){
  var direction$$ = direction$.toProperty();
  var initialHead = getAvailablePosition([]);

  //the snake's head
  var head$ = Bacon.update(
    initialHead,
    [direction$, ticks$], getNextHeadPosition,
    [direction$$, ticks$], getNextHeadPosition
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
    0,
    [eatenFood$], R.add(config.FOOD_INCREASE+1),
    [head$], decreaseUntilZero
  ).skipDuplicates();

  //The current length of the snake
  var length$$ = Bacon.update(
    1,
    [growthBuffer$$, head$], R.flip(increaseIfBufferIsNotEmpty)
  ).skipDuplicates();

  //the latest "length$$" positions where the head of the snake has passed
  //through. In other words: the positions of the full body of the snake
  //(including its head)
  var snake$$ = Bacon.update(
    Immutable.List.of(initialHead),
    [head$, length$$], function(old, head, len){
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  );

  //the position of food
  var food$$ = Bacon.update(
    getAvailablePosition([initialHead]),
    [head$, snake$$], function(food, head, snake){
      return R.eqDeep(food, head) ?
              getAvailablePosition(snake.toArray()) :
              food;
    }
  ).skipDuplicates();

  //if the food changes that means that the snake has eaten,
  //therefore we need to plug these changes to 'eatenFood$'
  eatenFood$.plug(food$$.skip(1));

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = snakeAndFood;
