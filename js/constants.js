var directions = {
  LEFT  : 'LEFT',
  RIGHT : 'RIGHT',
  UP    : 'UP',
  DOWN  : 'DOWN'
};

var directions_mutations = {
  'LEFT'  : { x: -1 },
  'RIGHT' : { x:  1 },
  'UP'    : { y: -1 },
  'DOWN'  : { y:  1 }
};

var keyboard_directions = {
  37: directions.LEFT,
  38: directions.UP,
  39: directions.RIGHT,
  40: directions.DOWN
};

module.exports = {
  DIRECTIONS: directions,
  KEYBOARD_DIRECTIONS: keyboard_directions,
  DIRECTIONS_MUTATIONS: directions_mutations
};
