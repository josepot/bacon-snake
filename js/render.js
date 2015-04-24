var R = require('ramda');
var config = require('./config.js');

var COLORS = config.COLORS;

function renderFrame(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.fillStyle = COLORS.FRAME;
  ctx.fillRect(x, y, width, height);
}

function renderGamePort(ctx, rows, cols, squareLength, left, top) {
  var width = squareLength * cols;
  var height = squareLength * rows;

  ctx.beginPath();
  ctx.fillStyle = COLORS.GAME;
  ctx.fillRect(left, top, width, height);
}

function renderLength(ctx, fontSize, textPosition, length) {
  ctx.font = (fontSize / 3) + 'pt Montserrat';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.TEXT;
  ctx.fillText("SCORE: " + length, textPosition.x, textPosition.y);
}

function renderSnake(ctx, squareLength, left, top, snake) {
  snake.forEach(function(s) {
    ctx.beginPath();
    ctx.fillStyle = COLORS.SNAKE;
    ctx.fillRect(
      left + (s.x * squareLength),
      top + (s.y * squareLength),
      squareLength,
      squareLength
    );
  });
}

function renderFood(ctx, squareLength, left, top, food) {
  ctx.beginPath();
  var rad = squareLength / 2;
  var x = left + (food.x * squareLength) + rad;
  var y = top + (food.y * squareLength) + rad;
  ctx.arc(x, y, rad, 0, 2 * Math.PI, false);
  ctx.fillStyle = COLORS.FOOD;
  ctx.fill();
}

function render(ctx, dimensions, snake, food) {
  var d = dimensions;
  ctx.canvas.width = d.outter.width;
  ctx.canvas.height = d.outter.height;
  ctx.clearRect(0, 0, d.outter.width, d.outter.height);
  renderFrame(ctx, d.widthPadding, 0, d.width, d.height);

  var gamePortLeft = d.widthPadding + (d.squareLength * config.MARGIN.LEFT);
  var gamePortTop = d.squareLength * config.MARGIN.TOP;
  renderGamePort(ctx, config.ROWS, config.COLS, d.squareLength,
    gamePortLeft, gamePortTop);
  renderSnake(ctx, d.squareLength, gamePortLeft, gamePortTop, snake);
  renderFood(ctx, d.squareLength, gamePortLeft, gamePortTop, food);
  renderLength(ctx, d.fontSize, d.textPosition, snake.size);
}

module.exports = R.curry(render);
