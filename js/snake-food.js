var Bacon = require('baconjs');
var Immutable = require('immutable');
var R = require('ramda');
var constants = require('./constants.js');
var config = require('./config.js');
var helpers = require('./helpers.js');

var getAvailablePosition =
  R.partialRight(helpers.getAvailablePosition, config.COLS, config.ROWS);

function getNextHeadPosition(prev, direction){
  if(R.isNil(direction)) return prev;
  return R.evolve(
    R.mapObj(R.add, constants.DIRECTIONS_MUTATIONS[direction]),
    prev
  );
}

function snakeAndFood(ticks$, direction$){
  var direction$$ = direction$.toProperty();
  var initialHead = getAvailablePosition([]);
  var decreaseUntilZero = R.pipe(R.dec, R.curryN(2, Math.max)(0));
  var increaseIfBufferIsNotEmpty = R.cond(
      [R.eq(0), R.nthArg(1)],
      [R.T, R.pipe(R.nthArg(1),R.add(1))]
    );

  var head$ = Bacon.update(
    initialHead,
    [direction$, ticks$], getNextHeadPosition,
    [direction$$, ticks$], getNextHeadPosition
  )
  .skipDuplicates()
  .changes();

  var eatenFood$ = new Bacon.Bus();
  var growthBuffer$$ = Bacon.update(
    0,
    [eatenFood$], R.add(config.FOOD_INCREASE+1),
    [head$], decreaseUntilZero
  ).skipDuplicates();
  var length$$ = Bacon.update(
    1,
    [growthBuffer$$, head$], R.flip(increaseIfBufferIsNotEmpty)
  ).skipDuplicates();

  var snake$$ = Bacon.update(
    Immutable.List.of(initialHead),
    [head$, length$$], function(old, head, len){
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  );

  var food$$ = Bacon.update(
    getAvailablePosition([initialHead]),
    [head$, snake$$], function(food, head, snake){
      return R.eqDeep(food, head) ?
              getAvailablePosition(snake.toArray()) :
              food;
    }
  ).skipDuplicates();
  eatenFood$.plug(food$$.changes());

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = snakeAndFood;
