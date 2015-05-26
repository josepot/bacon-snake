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
  var dimension$ = signals.getDimension$(
    Bacon.fromEvent(window, 'load'),
    Bacon.fromEvent(window, 'resize')
  );
  var keyUp$ = Bacon.fromEvent(window, 'keyup');
  var space$ = signals.getSpecificKey$(keyUp$, constants.KEYBOARD_KEYS.SPACE);

  var gameStart$ = new Bacon.Bus();
  var gameEnd$ = new Bacon.Bus();
  var gameEvent$ = gameStart$.map('START').merge(gameEnd$.map('END'));

  var gameActive$$ = gameEvent$.scan(false, R.flip(R.eq('START')));
  var paused$$ = space$.filter(gameActive$$).scan(false, R.not);
  var keyUpDuringUnPausedGame$ = keyUp$.filter(gameActive$$)
                                       .filter(paused$$.not());

  var direction$ = signals.getDirection$(keyUpDuringUnPausedGame$, gameStart$)
                          .filter(gameActive$$)
                          .filter(paused$$.not());

  var tick$ = signals.getTick$(config.TICK_FREQUENCY)
                      .filter(gameActive$$)
                      .filter(paused$$.not());

  var head$ = signals.getHead$(gameStart$, tick$, direction$);
  var snake$$AndFood$$ = signals.getSnakeAndFood$$(head$, gameStart$);
  var snake$$ = snake$$AndFood$$.snake$$;
  var food$$ = snake$$AndFood$$.food$$;

  var ctx = document.getElementById('canvas').getContext('2d');
  Bacon.onValues(dimension$, snake$$, food$$, renderer(ctx));

  gameEnd$.plug(signals.getCollision$(snake$$));
  gameStart$.plug(space$.filter(gameActive$$.not()).map(Date.now));
  gameStart$.push(Date.now());
}

document.addEventListener('DOMContentLoaded', main);
