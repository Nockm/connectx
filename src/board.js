function uniqify(items) {
	return items
		.map(JSON.stringify)
		.filter((value, index, self) => self.indexOf(value) === index)
		.map(JSON.parse);
}

function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

var mod = {};

Object.assign(mod, function() {
	var CELL_EMPTY = '.';
	var CELL_PLAYER_1 = 'X';
	var CELL_PLAYER_2 = 'O';
	var SCORE_WINNER_PLAYER_1 = -1000;
	var SCORE_WINNER_PLAYER_2 = +1000;

	var Board = function Board(w, h, winningLength) {
		// Game settings.
		this.w = w | 12;
		this.h = h | 12;
		this.winningLength = winningLength | 5;

		// Game state.
		this.matrix = new Array(this.h).fill(CELL_EMPTY).map(() => new Array(this.w).fill(CELL_EMPTY));
		this.moveHistory = [];
		this.nextPlayer = CELL_PLAYER_1;
	}

	Object.assign(Board.prototype, {
		toString() {
			return [
				`***** ${this.getPrevPlayer()} played ${this.getPrevMove()} *****`,
				...this.matrix.map((x) => x.join(' ')),
				'',
			].join('\n');
		},
		clone() {
			var clone = new Board(this.w, this.h, this.winningLength);
			Object.assign(clone, deepClone({
				matrix: this.matrix,
				moveHistory: this.moveHistory,
				nextPlayer: this.nextPlayer,
			}));
			return clone;
		},
		getPrevPlayer() {
			return this.nextPlayer === CELL_PLAYER_1 ? CELL_PLAYER_2 : CELL_PLAYER_1;
		},
		getPrevMove() {
			return this.moveHistory[this.moveHistory.length - 1];
		},
		makeMove(xy) {
			this.matrix[xy[1]][xy[0]] = this.nextPlayer;
			this.nextPlayer = this.getPrevPlayer();
			this.moveHistory.push(xy);
			return this;
		},
		serializeBoard() {
			return this.matrix
				.map((chars) => chars.join(''))
				.join('\n');
		},
		isGameOver() {
			var player1HasWon = this.getScore() === SCORE_WINNER_PLAYER_1;
			var player2HasWon = this.getScore() === SCORE_WINNER_PLAYER_2;
			var boardIsFull = !this.serializeBoard().includes(CELL_EMPTY);
			return player1HasWon || player2HasWon || boardIsFull;
		},
		isValidXY(x, y) {
			return x >= 0 && y >= 0 && x < this.w && y < this.h;
		},
		getAllBoardLines() {
			var getLineCol = (col) => this.matrix.map((row) => row[col]);
			var getLineRow = (row) => this.matrix[row];
			var getLineDiag = (x, y, positiveX) => {
				var array = [];
				while(this.isValidXY(x, y)) {
					array.push(this.matrix[y][x]);
					if (positiveX) { x++; } else { x--; }
					y++;
				}
				return array;
			}

			return [
				...new Array(this.w).fill(CELL_EMPTY).map((value, x) => getLineCol(x)),
				...new Array(this.h).fill(CELL_EMPTY).map((value, y) => getLineRow(y)),
				...new Array(this.w).fill(CELL_EMPTY).map((value, x) => getLineDiag(x, 0, false)),
				...new Array(this.h).fill(CELL_EMPTY).map((value, y) => getLineDiag(0, y, false)),
				...new Array(this.w).fill(CELL_EMPTY).map((value, x) => getLineDiag(x, 0, true)),
				...new Array(this.h).fill(CELL_EMPTY).map((value, y) => getLineDiag(this.w - 1, y, true)),
			]
			.filter((value) => value.length >= this.winningLength)
			.map((value) => value.join(''))
			.join('\n');
		},
		getScore() {
			var allBoardLines = this.getAllBoardLines();

			// Game over
			if (allBoardLines.includes(CELL_PLAYER_1.repeat(this.winningLength))) { return Math.floor(SCORE_WINNER_PLAYER_1); }
			if (allBoardLines.includes(CELL_PLAYER_2.repeat(this.winningLength))) { return Math.floor(SCORE_WINNER_PLAYER_2); }

			// Two-way inevitable win
			if (allBoardLines.includes(CELL_EMPTY + CELL_PLAYER_1.repeat(this.winningLength - 1) + CELL_EMPTY)) { return Math.floor(SCORE_WINNER_PLAYER_1 - 1); }
			if (allBoardLines.includes(CELL_EMPTY + CELL_PLAYER_2.repeat(this.winningLength - 1) + CELL_EMPTY)) { return Math.floor(SCORE_WINNER_PLAYER_2 - 1); }

			// Less than full streak
			for (blank=1; blank<this.winningLength - 2; blank++) {
				var streakP1 = CELL_PLAYER_1.repeat(this.winningLength - blank);
				var streakP2 = CELL_PLAYER_2.repeat(this.winningLength - blank);
				var streakBlank = CELL_EMPTY.repeat(blank);
				var pct = (this.winningLength - blank) / this.winningLength;

				if (allBoardLines.includes(streakP1 + streakBlank)) { return Math.floor(SCORE_WINNER_PLAYER_1 * pct); }
				if (allBoardLines.includes(streakBlank + streakP1)) { return Math.floor(SCORE_WINNER_PLAYER_1 * pct); }

				if (allBoardLines.includes(streakP2 + streakBlank)) { return Math.floor(SCORE_WINNER_PLAYER_2 * pct); }
				if (allBoardLines.includes(streakBlank + streakP2)) { return Math.floor(SCORE_WINNER_PLAYER_2 * pct); }
			}

			return 0;
		},
		getNextPossibleMoves() {
			var adjacents = [];
			for(y=0; y<this.h; y++) {
				for(x=0; x<this.w; x++) {
					if (this.matrix[y][x] !== CELL_EMPTY) {
						adjacents.push([x-1, y-1]); adjacents.push([x  , y-1]); adjacents.push([x+1, y-1]);
						adjacents.push([x-1, y  ]);                             adjacents.push([x+1, y  ]);
						adjacents.push([x-1, y+1]); adjacents.push([x  , y+1]); adjacents.push([x+1, y+1]);
					}
				}
			}

			if (adjacents.length === 0) {
				adjacents.push([
					Math.floor(this.w/2),
					Math.floor(this.h/2),
				])
			}

			var uniqueAdjacents = uniqify(adjacents);
			var validUniqueAdjacents = uniqueAdjacents
				.filter((point) => point[0] >= 0 && point[0] < this.w)
				.filter((point) => point[1] >= 0 && point[1] < this.h)
				.filter((point) => this.matrix[point[1]][point[0]] === CELL_EMPTY)
				;

			return validUniqueAdjacents;
		},
		getNextPossibleBoards() {
			var nextPossibleMoves = this.getNextPossibleMoves();
			var nextPossibleBoards = nextPossibleMoves.map((nextPossibleMove) => this.clone().makeMove(nextPossibleMove))
			return nextPossibleBoards;
		},
		getPredictedGame(depth) {
			predictionInvocationCount++;

			// Game end: A player won.
			if (this.isGameOver()) {
				return this;
			}

			var nextPossibleBoards = this.getNextPossibleBoards();

			// Game end: Draw game.
			if (nextPossibleBoards.length === 0) {
				return this;
			}

			var nextMoves = depth <= 0 ? nextPossibleBoards : nextPossibleBoards.map((x) => x.getPredictedGame(depth - 1));

			if (this.nextPlayer === CELL_PLAYER_1) {
				return nextMoves
					.sort(function(a, b) { return a.moveHistory.length - b.moveHistory.length})
					.sort(function(a, b) { return a.getScore() - b.getScore() })
					[0];
			}

			if (this.nextPlayer === CELL_PLAYER_2) {
				return nextMoves
					.sort(function(a, b) { return a.moveHistory.length - b.moveHistory.length})
					.reverse()
					.sort(function(a, b) { return a.getScore() - b.getScore() })
					.reverse()
					[0];
			}
		},
		makeNextMove() {
			var movesMade = this.moveHistory.length;
			var predictedGame = this.getPredictedGame(1);
			var nextXY = predictedGame.moveHistory[movesMade];
			this.makeMove(nextXY);
		}
	})

	return {
		Board: Board
	};
}());

module.exports = mod.Board;
