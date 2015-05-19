'use strict';

var Bacon = require('baconjs');
var R = require('ramda');
var Immutable = require('immutable');

var config = require('./config.js');
var constants = require('./constants.js');
var M  = require('./modulators.js');

var increaseIfBufferIsNotEmpty = R.cond(
  [R.gt(1), R.nthArg(1)],
  [R.T, R.pipe(R.nthArg(1),R.add(1))]
);
var getAvailablePosition =
  R.partialRight(M.getAvailablePosition, config.COLS, config.ROWS);
var getRandomPosition = R.partial(M.getAvailablePosition,
                                  Immutable.List(), config.COLS, config.ROWS);

function getCollision$(snake$$) {
  return snake$$.filter(
    R.partialRight(M.isThereCollision, config.COLS, config.ROWS)
  )
  .map(Date.now())
  .changes();
}

function getDimension$(load$, resize$) {
  return load$.merge(resize$)
    .map(function (){
      return {
        width: window.innerWidth * 2,
        height: window.innerHeight * 2
      };
    })
    .map(M.getDimensions);
}

function getKey$(keyUp$, key) {
  return keyUp$
    .filter(R.pipe(R.prop('which'), R.eq(key)));
}

function getHead$(gameStart$, tick$, direction$){
  var direction$$ = direction$.toProperty();
  return Bacon.update(
    null,
    [gameStart$], R.nAry(0, getRandomPosition),
    [direction$, tick$], M.getNextHead,
    [direction$$, tick$], M.getNextHead
  ).changes();
}

function getDirection$(keyUp$, gameEnd$) {
  var direction$ =
    keyUp$.map(R.pipe(
            R.prop('which'),
            R.flip(R.prop)(constants.KEYBOARD_DIRECTIONS)
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
  //this is actually a 'stepper' of the food that gets eaten by the snake
  var eatenFood$ = new Bacon.Bus();

  //after the snake eats, its length will increase in the next X movements.
  //Therefore we need to keep a buffer that indicates how much more the snake
  //is supposed to grow. The buffer will decrease as the snake moves and
  //it will increase every time the snake eats
  var growthBuffer$$ = Bacon.update(
    0 - (config.FOOD_INCREASE + 1),
    [head$, gameStart$], R.always(0 - (config.FOOD_INCREASE + 1)),
    [eatenFood$], R.add(config.FOOD_INCREASE + 1),
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
    [head$, gameStart$], function(old, head) { return Immutable.List.of(head);},
    [head$, length$$], function(old, head, len) {
      var result = old.unshift(head);
      return len === result.size ?
              result :
              result.pop();
    }
  ).filter(R.compose(R.not, R.isNil));

  //the position of food
  var food$$ = Bacon.update(
    null,
    [snake$$, head$, gameStart$], R.compose(getAvailablePosition, R.nthArg(1)),
    [head$, snake$$], R.cond(
      [R.eqDeep, R.compose(getAvailablePosition, R.nthArg(2))],
      [R.T, R.identity]
    )
  ).skipDuplicates();

  //if the food changes that means that the snake has eaten,
  //therefore we need to plug these changes to 'eatenFood$'
  eatenFood$.plug(food$$);

  return {
    snake$$: snake$$,
    food$$: food$$
  };
}

module.exports = {
  getDimension$: getDimension$,
  getHead$: getHead$,
  getKey$: getKey$,
  getDirection$: getDirection$,
  getTick$: getTick$,
  getSnakeAndFood$$: getSnakeAndFood$$,
  getCollision$: getCollision$
};
