var Bacon = require('baconjs');
var R = require('ramda');

var config = require('./js/config.js');
var constants = require('./js/constants.js');
var helpers = require('./js/helpers.js');
var streams = require('./js/streams-generator.js');
var getSnakeAndFood = require('./js/snake-food.js');
var renderer = require('./js/render.js');
var getAvailablePosition =
  R.partial(helpers.getAvailablePosition,[] ,config.COLS, config.ROWS);

/**************************************************
 *         VARIABLES NAMING CONVENTION            *
 *         ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾            *
 * EventStream variables end with $, i.e: `ticks$ *
 * Properties end with $$, i.e: `game$$`          *
 * ************************************************/

function main(){
  var gameStart$ = new Bacon.Bus();
  var gameEnd$ = new Bacon.Bus();
  var gameEvents$ = gameStart$.map('START').merge(gameEnd$.map('END'));
  var gameActive$$ = gameEvents$.scan(false, R.flip(R.eq('START')));

  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = streams.getKeyStream(keyUp$, constants.KEYBOARD_KEYS.SPACE);
  var paused$$ = space$.filter(gameActive$$).scan(false, R.not);

  var direction$ = streams.getDirectionStream(keyUp$.filter(gameActive$$)
                                                    .filter(paused$$.not()),
                                              gameEnd$);
  var direction$$ = direction$.toProperty();
  var ticks$ = streams.getTicksStream(config.TICK_FREQUENCY)
                      .skipUntil(direction$)
                      .filter(gameActive$$)
                      .filter(paused$$.not());
  var head$ = Bacon.update(
    null,
    [gameStart$], R.nAry(0, getAvailablePosition),
    [direction$, ticks$], helpers.getNextHeadPosition,
    [direction$$, ticks$], helpers.getNextHeadPosition
  )
  .changes();
  var snakeAndFood = getSnakeAndFood(head$, gameStart$);
  var snake$$ = snakeAndFood.snake$$;
  var food$$ = snakeAndFood.food$$;

  var dimensions$ = streams.getDimensionsStream(
    $(window).asEventStream('load'),
    $(window).asEventStream('resize')
  );
  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon
  .onValues(dimensions$, snake$$, food$$, function(dimensions, snake, food){
    render(dimensions, snake, food);
    if(snake && helpers.isThereCollision(snake, config.COLS, config.ROWS)){
     gameEnd$.push(Date.now());
    }
  });

  gameStart$.push(Date.now());
  gameStart$.plug(space$.filter(gameActive$$.not()).map(Date.now()));
}

$(main);
