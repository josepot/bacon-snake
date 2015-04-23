var Immutable = require('immutable');
var R = require('ramda');

function newSnake(old, direction){
  var positions = old.snake;
  var lastPosition = positions.get(0);
  var newPosition;
  switch(direction){
    case 'LEFT':
      newPosition = {x: lastPosition.x-1, y:lastPosition.y};
      break;
    case 'RIGHT':
      newPosition = {x: lastPosition.x+1, y:lastPosition.y};
      break;
    case 'UP':
      newPosition = {x: lastPosition.x, y:lastPosition.y-1};
      break;
    case 'DOWN':
      newPosition = {x: lastPosition.x, y:lastPosition.y+1};
      break;
    default:
      return positions;
  }

  positions = positions.unshift(newPosition);

  return old.growthLeft === 0 ?
          positions.slice(0, positions.size-1):
          positions;
}

function isThereCoalition(snake, rows, cols){
  var lastPosition = snake.get(0);
  if(lastPosition.x < 0 || lastPosition.y <0 ||
     lastPosition.x >= cols || lastPosition.y>=rows){
    return true;
  }
  return R.containsWith(function(a, b){
          return a.x===b.x && a.y===b.y;
        }, lastPosition, snake.slice(1).toArray());
}

module.exports = {
  newSnake: newSnake,
  isThereCoalition: isThereCoalition
};
