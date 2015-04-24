var R = require('ramda');
var Bacon = require('baconjs');
var Immutable = require('immutable');

var config = require('./js/config.js');
var streams = require('./js/streams-generator.js');
var ticker = require('./js/ticker.js');
var snakeHelper = require('./js/snake.js');
var getEmptyPosition = require('./js/food.js');
var renderer = require('./js/render.js');

/**************************************************
 *         VARIABLES NAMING CONVENTION            *
 *         ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾            *
 * EventStream variables end with $, i.e: `ticks$ *
 * Properties end with $$, i.e: `game$$`          *
 * ************************************************/

function main(){
  //Event Streams
  var dimensions$ = streams.getDimensionsStream(
    $(window).asEventStream('load'),
    $(window).asEventStream('resize')
  );
  var ticks$ = ticker(config.TICK_FREQUENCY);
  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = streams.getSpaceStream(keyUp$);
  var direction$ = streams.getDirectionStream(keyUp$, space$);

  //Properties
  var direction$$ = direction$.toProperty();
  var dimensions$$ = dimensions$.toProperty();

  function resetGame(old){
    if (old && old.end === false) return old;
    var snake = Immutable.List.of(
      getEmptyPosition([], config.COLS, config.ROWS)
    );
    return {
      snake: snake,
      food : getEmptyPosition(snake.toArray(), config.COLS, config.ROWS),
      growthLeft: 0,
      end: false
    };
  }

  function updateGame(old, ticks, direction, dimensions){
    if (old.end === true) return old;

    var newSnake = snakeHelper.newSnake(old.snake, old.growthLeft, direction);
    var newFood = old.food;
    var newGrowthLeft = Math.max(old.growthLeft-1, 0);
    var newPosition = newSnake.get(0);
    var end =
      snakeHelper.isThereCollision(newSnake, config.COLS, config.ROWS);

    if (!end && newPosition.x == old.food.x && newPosition.y == old.food.y) {
      newGrowthLeft += config.FOOD_INCREASE;
      newFood =
        getEmptyPosition(newSnake.toArray(), config.COLS, config.ROWS);
    }

    return {
      snake: newSnake,
      food: newFood,
      growthLeft: newGrowthLeft,
      end: end
    };
  }

  var game$$ = Bacon.update(
    //initial Value
    resetGame(),

    //syncing the direction$ with the ticks$: which means that new value/s have
    //been added to the direction$ stream before the tick
    [ticks$, direction$, dimensions$$], updateGame,

    //this means that the tick has happen and the "direction$ buffer" is empty
    //in other words: no changes in the direction that haven't been processed
    [ticks$, direction$$, dimensions$$], updateGame,

    //the user hit the space bar
    [space$], resetGame
  ).skipDuplicates();

  //Render will happen any time the dimension$ or the game$ get new values
  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon.onValues(dimensions$, game$$, function(dimensions, game){
    render(dimensions, game.snake, game.food);
  });
}

$(main);
