var Bacon = require('baconjs');

var config = require('./js/config.js');
var helper = require('./js/helpers.js');
var streams = require('./js/streams-generator.js');
var getSnakeAndFood = require('./js/snake-food.js');
var renderer = require('./js/render.js');

/**************************************************
 *         VARIABLES NAMING CONVENTION            *
 *         ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾            *
 * EventStream variables end with $, i.e: `ticks$ *
 * Properties end with $$, i.e: `game$$`          *
 * ************************************************/

  function play(ticks$, direction$, dimensions$){
    return new Promise(function(resolve){
      var snakeAndFood = getSnakeAndFood(ticks$, direction$);
      var snake$$ = snakeAndFood.snake$$;
      var food$$ = snakeAndFood.food$$;

      var ctx = $('canvas')[0].getContext('2d');
      var render = renderer(ctx);
      Bacon.onValues(dimensions$, snake$$, food$$,
        function(dimensions, snake, food){
          render(dimensions, snake, food);
          if(helper.isThereCollision(snake, config.COLS, config.ROWS)){
            resolve();
            return Bacon.noMore;
          }
        }
      );
    });
  }

function main(){
  var keyUp$ = $(window).asEventStream('keyup');
  var space$ = streams.getSpaceStream(keyUp$);

    var dimensions$ = streams.getDimensionsStream(
      $(window).asEventStream('load'),
      $(window).asEventStream('resize')
    );
    var ticksManager = new streams.ticks();
    var direction$ = streams.getDirectionStream(keyUp$, space$);
    var ticks$ = ticksManager.start(config.TICK_FREQUENCY)
               .skipUntil(direction$);
    play(ticks$, direction$, dimensions$).then(function(){
        ticksManager.stop();
        return "END";
      });
}

$(main);
