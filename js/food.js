var R = require('ramda');

function getFoodPosition(snakePositions, rows, cols){
  var candidates =
    R.flatten(
    R.range(0, cols)
      .map(function(c){
        return R.range(0, rows).map(function(r){
          return {x:c, y:r};
        });
      })).filter(function(position){
        return !R.containsWith(function(a, b){
          return a.x===b.x && a.y===b.y;
        }, position, snakePositions);
      });
  var selected = Math.floor(Math.random() * candidates.length);
  return candidates[selected];
}

module.exports = getFoodPosition;
