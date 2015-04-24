var R = require('ramda');

function getFoodPosition(snakePositions, cols, rows) {
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

module.exports = getFoodPosition;
