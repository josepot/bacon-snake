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

  var head$$ = Bacon.update(
    initialHead,
    [direction$, ticks$], getNextHeadPosition,
    [direction$$, ticks$], getNextHeadPosition
  ).skipDuplicates();
  var head$ = head$$.changes();

  var growth$ = new Bacon.Bus();
  var growthBuffer$$ = Bacon.update(
    0,
    [growth$], R.pipe(R.add, R.add(1)),
    [head$], R.pipe(R.dec, R.curryN(2, Math.max)(0))
  ).skipDuplicates();
  var length$$ = Bacon.update(
    1,
    [growthBuffer$$, head$], function(old, buffer){
      return buffer===0 ? old : old + 1;
    }
  ).skipDuplicates();

  var snake$$ = Bacon.update(
    Immutable.List.of(initialHead),
    [head$, length$$], function(old, head, len){
      var result = old.unshift(head);
      return len===result.size?
              result :
              result.slice(0, result.size-1);
    }
  );

  var food$$ = Bacon.update(
    getAvailablePosition([initialHead]),
    [head$, snake$$], function(food, head, snake){
      if(R.eqDeep(food, head)){
        growth$.push(config.FOOD_INCREASE);
        return getAvailablePosition(snake.toArray());
      }
      return food;
    }
  ).skipDuplicates();

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = snakeAndFood;
