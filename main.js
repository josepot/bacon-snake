var Bacon = require('baconjs');
var R = require('ramda');

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
  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = streams.getSpaceStream(keyUp$);
  var dimensions$ = streams.getDimensionsStream(
    $(window).asEventStream('load'),
    $(window).asEventStream('resize')
  );

  var gameStart$ = new Bacon.Bus();
  var gameEnd$ = new Bacon.Bus();
  var gameEvents$ = gameStart$.map('START').merge(gameEnd$.map('END'));
  var gameActive$$ = gameEvents$.scan(false, R.flip(R.eq('START')));
  var paused$$ = space$.filter(gameActive$$)
                       .scan(false, R.not);

  var direction$ = streams.getDirectionStream(keyUp$, gameEnd$)
                          .filter(gameActive$$)
                          .filter(paused$$.not())
                          .merge(gameEnd$.map(null));
  var ticks$ = streams.getTicksStream(config.TICK_FREQUENCY)
                      .skipUntil(direction$)
                      .filter(gameActive$$)
                      .filter(paused$$.not());

  var snakeAndFood = getSnakeAndFood(direction$, ticks$, gameStart$);
  var snake$$ = snakeAndFood.snake$$;
  var food$$ = snakeAndFood.food$$;

  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon
  .onValues(dimensions$, snake$$, food$$, function(dimensions, snake, food){
    render(dimensions, snake, food);
    if(snake && helper.isThereCollision(snake, config.COLS, config.ROWS)){
     gameEnd$.push(Date.now());
     gameStart$.push(Date.now());
    }
  });
  gameStart$.push(Date.now());
}

$(main);
