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
    Bacon.fromEvent(window, 'load'),
    Bacon.fromEvent(window, 'resize')
  );
  var keyUp$ = Bacon.fromEvent(window, 'keyup');
  var space$ = signals.getKey$(keyUp$, constants.KEYBOARD_KEYS.SPACE);

  var gameStart$ = new Bacon.Bus();
  var gameEnd$ = new Bacon.Bus();
  var gameEvents$ = gameStart$.map('START').merge(gameEnd$.map('END'));

  var gameActive$$ = gameEvents$.scan(false, R.flip(R.eq('START')));
  var paused$$ = space$.filter(gameActive$$).scan(false, R.not);
  var keyUpDuringUnPausedGame$ = keyUp$.filter(gameActive$$)
                                       .filter(paused$$.not());

  var direction$ = signals.getDirection$(keyUpDuringUnPausedGame$, gameEnd$);

  var ticks$ = signals.getTicks$(config.TICK_FREQUENCY)
                      .skipUntil(direction$)
                      .filter(gameActive$$)
                      .filter(paused$$.not());

  var head$ = signals.getHead$(gameStart$, ticks$, direction$);
  var snake$$AndFood$$ = signals.getSnakeAndFood$$(head$, gameStart$);
  var snake$$ = snake$$AndFood$$.snake$$;
  var food$$ = snake$$AndFood$$.food$$;

  var ctx = document.getElementById('canvas').getContext('2d');
  Bacon.onValues(dimensions$, snake$$, food$$, renderer(ctx));

  gameEnd$.plug(signals.getCollisions$(snake$$));
  gameStart$.plug(space$.filter(gameActive$$.not()).map(Date.now()));
  gameStart$.push(Date.now());
}

document.addEventListener('DOMContentLoaded', main);
