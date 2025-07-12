class SudokuGame {
  constructor() {
    this.board = [];
    this.solution = [];
    this.selectedCell = null;
    this.memoMode = false;
    this.startTime = null;
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.fixedCells = new Set();
    this.notes = {}; // cellId -> Set of numbers

    this.initializeGame();
  }

  initializeGame() {
    this.setupEventListeners();
    this.setTheme('light'); // デフォルトテーマ
  }

  setupEventListeners() {
    // 難易度選択
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.difficulty = e.target.dataset.difficulty;
        this.startNewGame();
      });
    });

    // 数字入力パネル
    const numberPanel = document.getElementById('number-panel');
    for (let i = 1; i <= 9; i++) {
      const btn = document.createElement('button');
      btn.className = 'btn btn--primary';
      btn.textContent = i;
      btn.addEventListener('click', () => this.inputNumber(i));
      numberPanel.appendChild(btn);
    }

    // 操作ボタン
    document.getElementById('memo-btn').addEventListener('click', () => this.toggleMemoMode());
    document.getElementById('erase-btn').addEventListener('click', () => this.eraseCell());
    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    document.getElementById('newgame-btn').addEventListener('click', () => this.showStartScreen());
    document.getElementById('complete-newgame').addEventListener('click', () => {
      document.getElementById('complete-modal').close();
      this.showStartScreen();
    });

    // モーダル関連
    document.getElementById('rules-btn').addEventListener('click', () => document.getElementById('rules-modal').showModal());
    document.getElementById('settings-btn').addEventListener('click', () => document.getElementById('settings-modal').showModal());

    // テーマ切り替え
    document.getElementById('light-theme').addEventListener('click', () => this.setTheme('light'));
    document.getElementById('dark-theme').addEventListener('click', () => this.setTheme('dark'));
  }

  generateSudoku(difficulty = 'easy') {
    // 事前に定義された完全な数独を使用（高速化のため）
    this.solution = this.getPresetSudoku();
    this.board = JSON.parse(JSON.stringify(this.solution));

    // 難易度に応じて数字を削除
    const emptyCells = {
      easy: 30,
      medium: 45,
      hard: 55,
    };

    this.removeNumbers(emptyCells[difficulty]);
    this.markFixedCells();
    this.notes = {};
  }

  getPresetSudoku() {
    // 事前に生成された完全な数独パズル
    const presetGrids = [
      [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ],
      [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 1, 4, 3, 6, 5, 8, 9, 7],
        [3, 6, 5, 8, 9, 7, 2, 1, 4],
        [8, 9, 7, 2, 1, 4, 3, 6, 5],
        [5, 3, 1, 6, 4, 2, 9, 7, 8],
        [6, 4, 2, 9, 7, 8, 5, 3, 1],
        [9, 7, 8, 5, 3, 1, 6, 4, 2]
      ],
      [
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 1, 5, 6, 4, 8, 9, 7],
        [5, 6, 4, 8, 9, 7, 2, 3, 1],
        [8, 9, 7, 2, 3, 1, 5, 6, 4]
      ]
    ];

    // ランダムに一つ選択
    const randomIndex = Math.floor(Math.random() * presetGrids.length);
    return presetGrids[randomIndex];
  }

  removeNumbers(count) {
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    const shuffled = this.shuffleArray(positions);
    for (let i = 0; i < count; i++) {
      const [r, c] = shuffled[i];
      this.board[r][c] = 0;
    }
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  markFixedCells() {
    this.fixedCells.clear();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] !== 0) {
          this.fixedCells.add(`${r}-${c}`);
        }
      }
    }
  }

  renderBoard() {
    const boardElement = document.getElementById('sudoku-board');
    boardElement.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // ブロック境界線
        if (c === 2 || c === 5) cell.classList.add('border-right-thick');
        if (r === 2 || r === 5) cell.classList.add('border-bottom-thick');

        // 固定セル
        if (this.fixedCells.has(`${r}-${c}`)) {
          cell.classList.add('fixed');
        }

        // セル内容
        if (this.board[r][c] !== 0) {
          cell.textContent = this.board[r][c];
        } else {
          const cellId = `${r}-${c}`;
          if (this.notes[cellId] && this.notes[cellId].size > 0) {
            const notesDiv = document.createElement('div');
            notesDiv.className = 'notes';
            for (let i = 1; i <= 9; i++) {
              const noteCell = document.createElement('div');
              noteCell.textContent = this.notes[cellId].has(i) ? i : '';
              notesDiv.appendChild(noteCell);
            }
            cell.appendChild(notesDiv);
          }
        }

        cell.addEventListener('click', () => this.selectCell(r, c));
        boardElement.appendChild(cell);
      }
    }
  }

  selectCell(row, col) {
    const cellId = `${row}-${col}`;
    if (this.fixedCells.has(cellId)) return;

    this.selectedCell = { row, col };
    this.updateCellHighlights();
  }

  updateCellHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
      cell.classList.remove('selected', 'related', 'error');
    });

    if (!this.selectedCell) return;

    const { row, col } = this.selectedCell;
    cells.forEach((cell) => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);

      if (r === row && c === col) {
        cell.classList.add('selected');
      } else if (
        r === row ||
        c === col ||
        (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))
      ) {
        cell.classList.add('related');
      }
    });

    this.checkErrors();
  }

  inputNumber(num) {
    if (!this.selectedCell) return;

    const { row, col } = this.selectedCell;
    const cellId = `${row}-${col}`;
    if (this.fixedCells.has(cellId)) return;

    if (this.memoMode) {
      if (!this.notes[cellId]) this.notes[cellId] = new Set();
      if (this.notes[cellId].has(num)) {
        this.notes[cellId].delete(num);
      } else {
        this.notes[cellId].add(num);
      }
      this.board[row][col] = 0; // メモ時は数字を消す
    } else {
      this.board[row][col] = num;
      delete this.notes[cellId];
    }

    this.renderBoard();
    this.updateCellHighlights();
    this.checkCompletion();
  }

  eraseCell() {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    const cellId = `${row}-${col}`;
    if (this.fixedCells.has(cellId)) return;

    this.board[row][col] = 0;
    delete this.notes[cellId];
    this.renderBoard();
    this.updateCellHighlights();
  }

  toggleMemoMode() {
    this.memoMode = !this.memoMode;
    document.getElementById('memo-btn').textContent = `メモモード: ${this.memoMode ? 'オン' : 'オフ'}`;
  }

  showHint() {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    const cellId = `${row}-${col}`;
    if (this.fixedCells.has(cellId)) return;

    this.board[row][col] = this.solution[row][col];
    delete this.notes[cellId];

    this.renderBoard();
    this.updateCellHighlights();
    this.checkCompletion();
  }

  checkErrors() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (this.board[r][c] !== 0 && this.board[r][c] !== this.solution[r][c]) {
        cell.classList.add('error');
      }
    });
  }

  checkCompletion() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] === 0) return false;
      }
    }
    if (this.isSolved()) {
      this.stopTimer();
      document.getElementById('complete-modal').showModal();
    }
    return true;
  }

  isSolved() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] !== this.solution[r][c]) return false;
      }
    }
    return true;
  }

  startNewGame() {
    this.generateSudoku(this.difficulty);
    this.renderBoard();
    this.showGameScreen();
    this.startTimer();
    const labels = { easy: '簡単', medium: '普通', hard: '難しい' };
    document.getElementById('difficulty-label').textContent = labels[this.difficulty];
  }

  showStartScreen() {
    // モーダルを閉じる
    const completeModal = document.getElementById('complete-modal');
    if (completeModal.open) {
      completeModal.close();
    }
    
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('game-container').classList.add('hidden');
    this.stopTimer();
  }

  showGameScreen() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-color-scheme', theme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SudokuGame();
});