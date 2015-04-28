var R = require('ramda');
var constants = require('./constants.js');

function getAvailablePosition(snakePositions, cols, rows) {
  var candidates =
    R.flatten(
      R.range(0, cols)
      .map(function(column) {
        return R.range(0, rows).map(function(row) {
          return {
            x: column,
            y: row
          };
        });
      })
    ).filter(function(position) {
      return !R.containsWith(function(a, b) {
        return a.x === b.x && a.y === b.y;
      }, position, snakePositions);
    });
  var selected = Math.floor(Math.random() * candidates.length);
  return candidates[selected];
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
function getNextHeadPosition(prev, direction, ticks){
  if(R.isNil(direction)) return prev;
  return R.evolve(
    R.mapObj(R.add, constants.DIRECTIONS_MUTATIONS[direction]),
    prev
  );
}

module.exports = {
  getAvailablePosition: getAvailablePosition,
  isThereCollision: isThereCollision,
  getNextHeadPosition: getNextHeadPosition
};
