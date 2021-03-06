'use strict';

var Immutable = require('immutable');
var R = require('ramda');
var M = require('../js/modulators.js');

describe('Modulators', function(){

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
      var availablePosition = M.getAvailablePosition(snake, 4, 2);
      expect(availablePosition).to.deep.equal({y:1, x:3});
    });

    it('should return a position different than the snake', function(){
      for(var i=0; i<10; i++){
        var availablePosition = M.getAvailablePosition(snake, 4, 4);
        var isInsideSnake = snake.some(R.eqDeep(availablePosition));
        expect(isInsideSnake).to.be.false;
      }
    });
  });

  describe('isThereCollision', function(){
    var snake;

    it('should detect out of bounds collisions', function(){
      snake = Immutable.List.of({y:-1, x:0});
      expect(M.isThereCollision(snake, 1, 1)).to.be.true;
      snake = Immutable.List.of({y:0, x:-1});
      expect(M.isThereCollision(snake, 1, 1)).to.be.true;
      snake = Immutable.List.of({y:0, x:1});
      expect(M.isThereCollision(snake, 1, 1)).to.be.true;
      snake = Immutable.List.of({y:1, x:0});
      expect(M.isThereCollision(snake, 1, 1)).to.be.true;
    });

    it('should detect snake collisions', function(){
      snake = Immutable.List.of(
        {y:0, x:0},
        {y:0, x:1},
        {y:1, x:1},
        {y:1, x:0},
        {y:0, x:0}
      );
      expect(M.isThereCollision(snake, 3, 3)).to.be.true;
    });

    it('shoud not detect a collision when there isn\'t one', function(){
      snake = Immutable.List.of(
        {y:0, x:0},
        {y:0, x:1},
        {y:1, x:1},
        {y:1, x:0}
      );
      expect(M.isThereCollision(snake, 2, 2)).to.be.false;
    });
  });

  describe('getNextHead', function(){
    it('should return the previous position when direction is nil', function(){
      var head = {y:0, x:0};
      expect(M.getNextHead(head)).to.equal(head);
    });

    it('should return the next position for the provided direction', function(){
      var head = {y:0, x:0};
      expect(M.getNextHead(head, 'LEFT')).to.deep.equal({x:-1, y:0});
      expect(M.getNextHead(head, 'RIGHT')).to.deep.equal({x:1, y:0});
      expect(M.getNextHead(head, 'UP')).to.deep.equal({x:0, y:-1});
      expect(M.getNextHead(head, 'DOWN')).to.deep.equal({x:0, y:1});
    });
  });
});
