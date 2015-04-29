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
    .map(R.pipe(R.prop('which'), R.eq(32)))
    .filter(R.identity);
}

function getDirectionStream(keyUp$, gameEnd$){
  var direction$ = keyUp$.map(
    R.pipe(R.prop('which'), R.flip(R.prop)(constants.KEYBOARD_DIRECTIONS))
  )
  .filter(R.compose(R.not, R.isNil))
  .merge(gameEnd$.map(null))
  .skipDuplicates();

  return direction$.diff(null, function(prev, last){
    var lastTwo = [prev, last].sort().join('-');
    return (['LEFT-RIGHT', 'DOWN-UP'].indexOf(lastTwo) > -1) ?
              'SKIP':
              last;
  })
  .filter(R.compose(R.not, R.eq('SKIP')))
  .changes();
}

function getTicksStream(ms){
  var start = Date.now();
  return Bacon.repeat(function(){
    return Bacon.later(ms, Date.now()-start);
  });
}

module.exports = {
  getDimensionsStream: getDimensionsStream,
  getSpaceStream: getSpaceStream,
  getDirectionStream: getDirectionStream,
  getTicksStream: getTicksStream
};
