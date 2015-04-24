var Immutable = require('immutable');
var R = require('ramda');

function getNewPositionFromDirection(direction, lastPosition){
  var evolution = {};
  switch (direction) {
    case 'LEFT':
      evolution = {x:R.add(-1)};
      break;
    case 'RIGHT':
      evolution = {x:R.add(1)};
      break;
    case 'UP':
      evolution = {y:R.add(-1)};
      break;
    case 'DOWN':
      evolution = {y:R.add(1)};
      break;
    default:
      return lastPosition;
  }
  return R.evolve(evolution, lastPosition);
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
