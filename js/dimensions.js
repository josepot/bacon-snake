var Bacon = require('baconjs');

var ROWS = 20;
var COLS = 30;
var MARGIN = {
  TOP: 1,
  RIGHT: 1,
  BOTTOM: 4,
  LEFT: 1
};

function getDimensions(rect){
  var result = {
    squareLength: 0,
    width: 0,
    height: 0,
    widthPadding: 0,
    heightPadding: 0,
    fontSize: 0,
    outter: rect,
    rows: ROWS,
    cols: COLS,
    margin: MARGIN,
    textPosition: {
      x:0,
      y:0
    }
  };

  var gameWidth = (COLS + MARGIN.LEFT + MARGIN.RIGHT);
  var gameHeight = (ROWS + MARGIN.TOP + MARGIN.BOTTOM);

  var gameProportions =  gameWidth / gameHeight;
  var windowProportions = rect.width / rect.height;

  if(gameProportions > windowProportions){
    result.squareLength = rect.width / gameWidth;
    result.widthPadding = 0;
    result.heightPadding = (rect.height-(result.squareLength * gameHeight)) / 2;
  }else{
    result.squareLength = rect.height / gameHeight;
    result.heightPadding = 0;
    result.widthPadding = (rect.width-(result.squareLength * gameWidth)) / 2;
  }

  result.width = gameWidth * result.squareLength;
  result.height = gameHeight * result.squareLength;
  result.fontSize = (MARGIN.BOTTOM * result.squareLength)/2;
  result.textPosition.x = rect.width / 2;
  result.textPosition.y =
    (result.heightPadding + (gameHeight * result.squareLength)) -
    ((MARGIN.BOTTOM * result.squareLength) * (1/4));

  return result;
}

module.exports = getDimensions;
