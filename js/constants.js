'use strict';

var constants = {
  KEYBOARD_KEYS: {
    SPACE: 32,
    RETURN: 13,
    ESC: 27
  },
  DIRECTIONS_MUTATIONS: {
    LEFT  : { x: -1 },
    RIGHT : { x:  1 },
    UP    : { y: -1 },
    DOWN  : { y:  1 }
  },
  KEYBOARD_DIRECTIONS: {
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN'
  }
};

module.exports = constants;
