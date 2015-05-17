'use strict';

describe('Helpers', function(){
  var helpers;
  var Immutable;
  beforeEach(function(){
    helpers = require('./helpers.js');
    Immutable = require('immutable');
  });
  describe('getAvailablePosition', function(){
    var snake;
    beforeEach(function(){
      snake = Immutable.List.of(
        {y:1, x:2},
        {y:1, x:1},
        {y:1, x:0},
        {y:0, x:0},
        {y:0, x:1},
        {y:0, x:2},
        {y:0, x:3}
      );
    });
    it('should return the only available position', function(){
      var availablePosition = helpers.getAvailablePosition(snake, 4, 2);
      expect(availablePosition).to.deep.equal({y:1, x:3});
    });
  });
});
