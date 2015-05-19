'use strict';

var R = require('ramda');
var constants = require('./constants.js');
var config = require('./config.js');

function getDimensions(rect) {
  var ROWS = config.ROWS;
  var COLS = config.COLS;
  var MARGIN = config.MARGIN;

  var result = {
    squareLength: 0,
    width: 0,
    height: 0,
    widthPadding: 0,
    fontSize: 0,
    outter: rect,
    textPosition: {
      x: 0,
      y: 0
    }
  };

  var gameWidth = (COLS + MARGIN.LEFT + MARGIN.RIGHT);
  var gameHeight = (ROWS + MARGIN.TOP + MARGIN.BOTTOM);

  var gameProportions = gameWidth / gameHeight;
  var windowProportions = rect.width / rect.height;

  if (gameProportions > windowProportions) {
    result.squareLength = rect.width / gameWidth;
    result.widthPadding = 0;
  } else {
    result.squareLength = rect.height / gameHeight;
    result.widthPadding = (rect.width - (result.squareLength * gameWidth)) / 2;
  }

  result.width = gameWidth * result.squareLength;
  result.height = gameHeight * result.squareLength;
  result.fontSize = (MARGIN.BOTTOM * result.squareLength) / 2;
  result.textPosition.x =
    result.widthPadding + (result.squareLength * MARGIN.LEFT * 2);
  result.textPosition.y =
    result.squareLength * MARGIN.TOP + result.height * 0.89;

  return result;
}

function getAvailablePosition(snakePositions, cols, rows) {
  var nAvailablePositions = (cols * rows) - snakePositions.size;
  var winner = Math.floor(Math.random() * nAvailablePositions);
  var sortedSnake = snakePositions.map(function(s){
    return (s.y * cols) + s.x;
  }).sort(R.comparator(R.lt));
  for (var i=0; i < sortedSnake.size && sortedSnake.get(i) <= winner; i++) {
    winner++;
  }
  return {x: winner%cols, y: Math.floor(winner/cols)};
}

function isThereCollision(snake, cols, rows) {
  var lastPosition = snake.get(0);
  return lastPosition.x < 0 || lastPosition.y < 0 ||
         lastPosition.x >= cols || lastPosition.y >= rows ||
         snake.slice(1).some(R.eqDeep(lastPosition));
}

function getNextHeadPosition(prev, direction) {
  return R.isNil(direction) ?
            prev :
            R.evolve(
              R.mapObj(R.add, constants.DIRECTIONS_MUTATIONS[direction]), prev
            );
}

module.exports = {
  getDimensions: getDimensions,
  getAvailablePosition: getAvailablePosition,
  isThereCollision: isThereCollision,
  getNextHeadPosition: getNextHeadPosition
};
