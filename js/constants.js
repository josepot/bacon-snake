var keyboard_keys = {
  SPACE: 32,
  RETURN: 13,
  ESC: 27
};

var directions_mutations = {
  LEFT  : { x: -1 },
  RIGHT : { x:  1 },
  UP    : { y: -1 },
  DOWN  : { y:  1 }
};

var keyboard_directions = {
  37: 'LEFT',
  38: 'UP',
  39: 'RIGHT',
  40: 'DOWN'
};

module.exports = {
  KEYBOARD_DIRECTIONS: keyboard_directions,
  DIRECTIONS_MUTATIONS: directions_mutations,
  KEYBOARD_KEYS: keyboard_keys
};
