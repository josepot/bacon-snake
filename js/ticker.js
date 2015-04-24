var Q = require('q');
var Bacon = require('baconjs');

function animationFramePromise() {
  var deferred = Q.defer();
  window.requestAnimationFrame(deferred.resolve);
  return deferred.promise;
}

module.exports = function(ms) {
  return Bacon.repeat(function() {
      return Bacon.fromPromise(animationFramePromise());
    })
    .map(function(domMs) {
      return (domMs / ms) | 0;
    })
    .skipDuplicates();
};
