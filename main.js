var R = require('ramda');
var Bacon = require('baconjs');
var Immutable = require('immutable');
var getdimensions = require('./js/dimensions.js');
var renderer = require('./js/render.js');
var ticker = require('./js/ticker.js');
var snakeHelper = require('./js/snake.js');
var getFood = require('./js/food.js');

//EventStream variables end with $, i.e: ticks$
//Propertie varibles end with $$, i.e: game$$

//dimensions stream
var load$ = $(window).asEventStream('load');
var resize$ = $(window).asEventStream('resize');
var dimensions$ =
  load$.merge(resize$)
      .map(function (){
        return {
          width: window.innerWidth * 2,
          height: window.innerHeight * 2
        };
      })
      .map(getdimensions);

$(document).on('ready', function(){
  var ticks$ = ticker(100);
  var keyUp$ = $(document).asEventStream('keyup');
  var arrows$ = keyUp$.map(function(e){
    switch(e.which){
      case 37:
        return 'LEFT';
      case 38:
        return 'UP';
      case 39:
        return 'RIGHT';
      case 40:
        return 'DOWN';
      default:
        return null;
    }
  }).filter(R.compose(R.not, R.isNil));

  var space$ = keyUp$.map(function(e){
    return e.which === 32;
  }).filter(function(x){return x;});

  var direction$ = Bacon.when(
    [space$], function(){return null;},
    [arrows$], function(a){return a;}
  )
  .skipDuplicates();

  direction$ = direction$.diff(null, function(prev, last){
    var lastTwo = [prev, last].sort().join('-');
    return (['LEFT-RIGHT', 'DOWN-UP'].indexOf(lastTwo)>-1) ?
      'SKIP':
      last;
  })
  .filter(function(d){
    return d!=='SKIP';
  })
  .changes();

  var direction$$ = direction$.toProperty();
  var dimensions$$ = dimensions$.toProperty();

  function resetGame(old){
    if(old && old.end===false) return old;
    return {
      snake: Immutable.List.of({x:0, y:0}),
      food : getFood([{x:0, y:0}], 20, 20),
      growthLeft: 0,
      end: false
    };
  }

  function updateGame(old, ticks, direction, dimensions){
    if(old.end===true) return old;

    var newSnake = snakeHelper.newSnake(old, direction);
    var newFood = old.food;
    var newGrowthLeft = Math.max(old.growthLeft-1, 0);
    var newPosition = newSnake.get(0);
    var end = snakeHelper.isThereCoalition(newSnake, dimensions.rows,
                                           dimensions.cols);
    if(!end && newPosition.x == old.food.x && newPosition.y == old.food.y){
      newGrowthLeft += 3;
      newFood = getFood(newSnake.toArray(), dimensions.rows, dimensions.cols);
    }
    return {
      snake: newSnake,
      food: newFood,
      growthLeft: newGrowthLeft,
      end: end
    };
  }

  var game$$ = Bacon.update(
    //initial Value
    resetGame(),

    //syncing the direction$ with the ticks$: which means that new values have
    //been added to the direction$ stream before the tick
    [ticks$, direction$, dimensions$$], updateGame,

    //this means that the tick has happen and the "direction$ buffer" is empty
    //in other words, no changes in the direction between one before the last tick
    [ticks$, direction$$, dimensions$$], updateGame,

    //the user hit the space bar
    [space$], resetGame
  ).skipDuplicates();

  //Render will happen any time the dimension$ or the game$ change
  var ctx = $('canvas')[0].getContext('2d');
  var render = renderer(ctx);
  Bacon.onValues(dimensions$, game$$, function(dimensions, game){
    render(dimensions, game.snake, game.food);
  });
});
