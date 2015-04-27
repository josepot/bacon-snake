var R = require('ramda');

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

module.exports = {
  getAvailablePosition: getAvailablePosition,
  isThereCollision: isThereCollision
};
