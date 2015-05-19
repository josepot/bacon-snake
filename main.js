'use strict';

var Bacon = require('baconjs');
var R = require('ramda');

var config = require('./js/config.js');
var constants = require('./js/constants.js');
var signals = require('./js/signals.js');
var M = require('./js/modulators.js');
var renderer = require('./js/render.js');
/**************************************************
 *         VARIABLES NAMING CONVENTION            *
 *         ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾            *
 * EventStream variables end with $, i.e: `ticks$ *
 * Properties end with $$, i.e: `game$$`          *
 * ************************************************/

function main() {
  var dimensions$ = signals.getDimensions$(
    $(window).asEventStream('load'),
    $(window).asEventStream('resize')
  );
  var gameStart$ = new Bacon.Bus();
  var gameEnd$ = new Bacon.Bus();
  var gameEvents$ = gameStart$.map('START').merge(gameEnd$.map('END'));
  var gameActive$$ = gameEvents$.scan(false, R.flip(R.eq('START')));

  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = signals.getKey$(keyUp$, constants.KEYBOARD_KEYS.SPACE);
  var paused$$ = space$.filter(gameActive$$).scan(false, R.not);

  var direction$ = signals.getDirection$(keyUp$.filter(gameActive$$)
                                                    .filter(paused$$.not()),
                                              gameEnd$);

  var ticks$ = signals.getTicks$(config.TICK_FREQUENCY)
                      .skipUntil(direction$)
                      .filter(gameActive$$)
                      .filter(paused$$.not());

  var head$ = signals.getHead$(gameStart$, ticks$, direction$);
  var snake$$AndFood$$ = signals.getSnakeAndFood$$(head$, gameStart$);
  var snake$$ = snake$$AndFood$$.snake$$;
  var food$$ = snake$$AndFood$$.food$$;

  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon
  .onValues(dimensions$, snake$$, food$$, function(dimensions, snake, food){
    render(dimensions, snake, food);
    if(snake && M.isThereCollision(snake, config.COLS, config.ROWS)){
     gameEnd$.push(Date.now());
    }
  });

  gameStart$.push(Date.now());
  gameStart$.plug(space$.filter(gameActive$$.not()).map(Date.now()));
}

$(main);
