var Immutable = require('immutable');
var R = require('ramda');
var constants = require('./constants.js');

function getNewPositionFromDirection(direction, lastPosition){
  var mutation = R.mapObj(
    function(val){return R.add(val);},
    constants.DIRECTIONS_MUTATIONS[direction]
  );

  return R.isNil(mutation) ?
          lastPosition :
          R.evolve(mutation, lastPosition);
}

function newSnake(oldSnake, growthLeft, direction) {
  var lastPosition = oldSnake.get(0);
  var newPosition = getNewPositionFromDirection(direction, lastPosition);
  if (newPosition === lastPosition) return oldSnake;

  var result = oldSnake.unshift(newPosition);

  return growthLeft === 0 ?
    result.slice(0, result.size - 1) :
    result;
}

function isThereCollision(snake, cols, rows) {
  var lastPosition = snake.get(0);
  if (lastPosition.x < 0 || lastPosition.y < 0 ||
    lastPosition.x >= cols || lastPosition.y >= rows) {
    return true;
  }
  return R.containsWith(function(a, b) {
    return a.x === b.x && a.y === b.y;
  }, lastPosition, snake.slice(1).toArray());
}

module.exports = {
  newSnake: newSnake,
  isThereCollision: isThereCollision
};
