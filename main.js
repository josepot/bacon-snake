var R = require('ramda');
var Bacon = require('baconjs');
var Immutable = require('immutable');

var config = require('./js/config.js');
var helper = require('./js/helpers.js');
var streams = require('./js/streams-generator.js');
var getSnakeAndFood = require('./js/snake-food.js');
var renderer = require('./js/render.js');

/**************************************************
 *         VARIABLES NAMING CONVENTION            *
 *         ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾            *
 * EventStream variables end with $, i.e: `ticks$ *
 * Properties end with $$, i.e: `game$$`          *
 * ************************************************/

function main(){
  var dimensions$ = streams.getDimensionsStream(
    $(window).asEventStream('load'),
    $(window).asEventStream('resize')
  );
  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = streams.getSpaceStream(keyUp$);
  var direction$ = streams.getDirectionStream(keyUp$, space$);
  var gameActive$ = new Bacon.Bus();
  var ticks$ = streams.getTicksStream(config.TICK_FREQUENCY, gameActive$)
               .skipUntil(direction$);
  var snakeAndFood = getSnakeAndFood(ticks$, direction$);
  var snake$$ = snakeAndFood.snake$$;
  var food$$ = snakeAndFood.food$$;

  gameActive$.plug(
    snake$$.map(function(snake){
      return !helper.isThereCollision(snake, config.COLS, config.ROWS);
    }).skipDuplicates().changes()
  );

  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon.onValues(dimensions$, snake$$, food$$,
                 function(dimensions, snake, food){
    render(dimensions, snake, food);
  });
}

$(main);
