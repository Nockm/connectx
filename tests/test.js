var Board = require('../src/board');

var boardInstance = new Board();
console.log(boardInstance.toString());

while(!boardInstance.isGameOver()) {
	predictionInvocationCount = 0;
	boardInstance.makeNextMove();
	console.log(predictionInvocationCount, boardInstance.getScore());
	console.log(boardInstance.toString());
}
