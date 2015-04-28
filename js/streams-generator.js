var Bacon = require('baconjs');
var R = require('ramda');
var getdimensions = require('./dimensions.js');
var config = require('./config.js');
var constants = require('./constants.js');
var helpers = require('./helpers.js');

function getDimensionsStream(load$, resize$){
  return load$.merge(resize$)
    .map(function (){
      return {
        width: window.innerWidth * 2,
        height: window.innerHeight * 2
      };
    })
    .map(getdimensions);
}

function getSpaceStream(keyUp$){
  return keyUp$
    .map(function(e){
      return e.which === 32;
    })
    .filter(function(x){return x;});
}

function getDirectionStream(keyUp$, space$){
  var arrows$ = keyUp$.map(function(e){
    return constants.KEYBOARD_DIRECTIONS[e.which];
  })
  .filter(R.compose(R.not, R.isNil));

  var direction$ = Bacon.when(
    [space$], function(){return null;},
    [arrows$], function(a){return a;}
  )
  .skipDuplicates();

  return direction$.diff(null, function(prev, last){
    var lastTwo = [prev, last].sort().join('-');
    return (['LEFT-RIGHT', 'DOWN-UP'].indexOf(lastTwo) > -1) ?
              'SKIP':
              last;
  })
  .filter(function(d){
    return d !== 'SKIP';
  })
  .changes();
}

function getTicksStream(ms){
  var start = Date.now();
  return Bacon.repeat(function(){
    return Bacon.later(ms, Date.now()-start);
  });
}

function getHeadStream(direction$, ticks$, gameStart$){
  var getAvailablePosition = R.nAry(0,
    R.partial(helpers.getAvailablePosition, [], config.COLS, config.ROWS));
  var direction$$ = direction$.toProperty();

  return Bacon.update(
    null,
    [gameStart$], getAvailablePosition,
    [direction$, ticks$], helpers.getNextHeadPosition,
    [direction$$, ticks$], helpers.getNextHeadPosition
  )
  .skipDuplicates()
  .changes();
}

module.exports = {
  getDimensionsStream: getDimensionsStream,
  getSpaceStream: getSpaceStream,
  getDirectionStream: getDirectionStream,
  getTicksStream: getTicksStream,
  getHeadStream: getHeadStream
};
