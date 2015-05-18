'use strict';

var R = require('ramda');
var constants = require('./constants.js');

function getAvailablePosition(snakePositions, cols, rows) {
  var nAvailablePositions = (cols * rows) - snakePositions.size;
  var winner = Math.floor(Math.random() * nAvailablePositions);
  var sortedSnake = snakePositions.map(function(s){
    return (s.y * cols) + s.x;
  }).sort(R.comparator(R.lt));
  for(var i=0; i < sortedSnake.size && sortedSnake.get(i) <= winner; i++){
    winner++;
  }
  return {x: winner%cols, y: Math.floowr(winner/cols)};
}

function isThereCollision(snake, cols, rows) {
  var lastPosition = snake.get(0);
  return lastPosition.x < 0 || lastPosition.y < 0 ||
         lastPosition.x >= cols || lastPosition.y >= rows ||
         snake.slice(1).some(R.eqDeep(lastPosition));
}

function getNextHeadPosition(prev, direction){
  return R.isNil(direction) ?
            prev :
            R.evolve(
              R.mapObj(R.add, constants.DIRECTIONS_MUTATIONS[direction]), prev
            );
}

module.exports = {
  getAvailablePosition: getAvailablePosition,
  isThereCollision: isThereCollision,
  getNextHeadPosition: getNextHeadPosition
};
