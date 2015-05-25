'use strict';

var Bacon = require('baconjs');
var R = require('ramda');
var Immutable = require('immutable');

var config = require('./config.js');
var constants = require('./constants.js');
var M  = require('./modulators.js');
var getAvailablePosition =
  R.partialRight(M.getAvailablePosition, config.COLS, config.ROWS);

function getCollision$(snake$$) {
  return snake$$.filter(
    R.partialRight(M.isThereCollision, config.COLS, config.ROWS)
  )
  .map(Date.now)
  .changes();
}

function getDimension$(load$, resize$) {
  return load$.merge(resize$)
    .map(function () {
      return {
        width: window.innerWidth * 2,
        height: window.innerHeight * 2
      };
    })
    .map(M.getDimensions);
}

function getSpecificKey$(keyUp$, key) {
  return keyUp$.filter(R.pipe(R.prop('which'), R.eq(key)));
}

function getHead$(gameStart$, tick$, direction$){
 var getRandomPosition = R.partial(M.getAvailablePosition,
                                  undefined, config.COLS, config.ROWS);
 var direction$$ = direction$.toProperty();
  return Bacon.update(
    null,
    [gameStart$], getRandomPosition,
    [direction$, tick$], M.getNextHead,
    [direction$$, tick$], M.getNextHead
  ).skipDuplicates().changes();
}

function getDirection$(keyUp$, gameEnd$) {
  var direction$ =
    keyUp$.map(R.pipe(
            R.prop('which'),
            R.partialRight(R.prop, constants.KEYBOARD_DIRECTIONS)
          ))
          .filter(R.compose(R.not, R.isNil))
          .merge(gameEnd$.map(null))
          .skipDuplicates();

  return direction$.diff(null, function(prev, last) {
    var lastTwo = [prev, last].sort().join('-');
    return (['LEFT-RIGHT', 'DOWN-UP'].indexOf(lastTwo) > -1) ?
              'SKIP':
              last;
  })
  .filter(R.compose(R.not, R.eq('SKIP')))
  .changes();
}

function getTick$(ms) {
  var start = Date.now();
  return Bacon.repeat(function() {
    return Bacon.later(ms, Date.now() - start);
  });
}

function getSnakeAndFood$$(head$, gameStart$) {
 var listOf = R.bind(Immutable.List.of, Immutable.List);

  //this is actually a 'stepper' of the food that gets eaten by the snake
  var eatenFood$ = new Bacon.Bus();

  //after the snake eats, its length will increase in the next X movements.
  //Therefore we need to keep a buffer that indicates how much more the snake
  //is supposed to grow. The buffer will decrease as the snake moves and
  //it will increase every time the snake eats
  var decreaseIfGreatterThanZero =
    R.cond([R.gt(R.__, 0), R.dec], [R.T, R.identity]);
  var growthBuffer$$ = Bacon.update(
    0,
    [head$, gameStart$], R.always(0),
    [head$, eatenFood$], R.add(config.FOOD_INCREASE),
    [head$], decreaseIfGreatterThanZero
  ).skipDuplicates();

  //The current length of the snake
  var increaseIfBufferIsNotEmpty = R.cond(
    [R.gt(R.__, 0), R.pipe(R.nthArg(1),R.add(1))],
    [R.T, R.nthArg(1)]
  );
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
    [head$, gameStart$], R.compose(listOf, R.nthArg(1)),
    [head$, length$$], function(old, head, len) {
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  ).filter(R.compose(R.not, R.isNil));

  //the position of food
  var getNewFoodPositionIfHeadHitsFood = R.cond(
    [R.eqDeep, R.compose(getAvailablePosition, R.nthArg(2))],
    [R.T, R.identity]
  );
  var food$$ = Bacon.update(
    null,
    [snake$$, head$, gameStart$], R.compose(getAvailablePosition, R.nthArg(1)),
    [head$, snake$$], getNewFoodPositionIfHeadHitsFood
  ).skipDuplicates();

  //if the food changes that means that the snake has eaten,
  //therefore we need to plug these changes to 'eatenFood$'
  var isInitialHead$$ = Bacon.update(
    true,
    [head$, gameStart$], true,
    [head$], false
  ).skipDuplicates();
  eatenFood$.plug(food$$.filter(isInitialHead$$.not()));

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = {
  getDimension$: getDimension$,
  getHead$: getHead$,
  getSpecificKey$: getSpecificKey$,
  getDirection$: getDirection$,
  getTick$: getTick$,
  getSnakeAndFood$$: getSnakeAndFood$$,
  getCollision$: getCollision$
};
