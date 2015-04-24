var Immutable = require('immutable');
var R = require('ramda');

function getNewPositionFromDirection(direction, lastPosition){
  switch (direction) {
    case 'LEFT':
      return R.evolve({x:R.add(-1)}, lastPosition);
    case 'RIGHT':
      return R.evolve({x:R.add(1)}, lastPosition);
    case 'UP':
      return R.evolve({y:R.add(-1)}, lastPosition);
    case 'DOWN':
      return R.evolve({y:R.add(1)}, lastPosition);
  }
}

function newSnake(old, direction) {
  var lastPosition = old.snake.get(0);
  var newPosition = getNewPositionFromDirection(direction, lastPosition);
  if(R.isNil(newPosition)) return old.snake;

  var result = old.snake.unshift(newPosition);

  return old.growthLeft === 0 ?
    result.slice(0, result.size - 1) :
    result;
}

function isThereCoalition(snake, cols, rows) {
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
  isThereCoalition: isThereCoalition
};
