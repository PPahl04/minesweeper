//contains all fields within the gameField 
let _board = []

let _currentBoardRowAndCol;
let _fieldAmount;
let _bombsInGF;

//htmlElements
let _remainingFlags;
let _boardProgress;
let _gameBoard;

//player specific elements
let _lossStreakCount = 0;
let _uncoveredFields;
let _setFlags;

const _fracNumBombs = 4;
const _noNeighboringBombs = "";


class Field {
    constructor(row, column, isBomb) {
        this._row = row;
        this._column = column;
        this._isBomb = isBomb;

        this._isRevealed = false;
        this._isFlagged = false;

        this._neighbors = [];
    }


    get row() {
        return this._row;
    }
   

    get column() {
        return this._column;
    }
   

    get isBomb() {
        return this._isBomb;
    }
   

    get isRevealed() {
        return this._isRevealed;
    }

    set isRevealed(bool) {
        this._isRevealed = bool;
    }

    
    get isFlagged() {
        return this._isFlagged;
    }

    set isFlagged (bool) {
        this._isFlagged = bool;
    }
    
    //only fields that aren't bombs should have a number
    set neighboringBombs(num) {
        this._neighboringBombs = this.isBomb ? "N/A" : num;
    }

    get neighboringBombs() {
        return this._neighboringBombs;
    }


    get htmlElement() {
        return this._htmlElement;
    }

    set htmlElement(el) {
        this._htmlElement = el;
    }


    get neighbors () {
        return this._neighbors;
    }
    
    set neighbors (field) {
        this._neighbors = field;
    }
}

//creates the game field in the gameField element
function setUpField(boardRowAndCol) {
    _remainingFlags = document.getElementById("remainingFlags");
    _gameBoard = document.getElementById("gameField");
    _boardProgress = document.getElementById("boardProgress");

    let maxRows = boardRowAndCol.split("x")[0];
    let maxColumns = boardRowAndCol.split("x")[1];
    _fieldAmount = maxRows * maxColumns;

    // determine the amount of bombs based on the field size
    _bombsInGF = Math.round((maxRows * maxColumns) / _fracNumBombs);
    _remainingFlags.textContent = `Remaining flags: ${_bombsInGF}/${_bombsInGF}`;
    _boardProgress.textContent = `Covered fields: ${_fieldAmount-_bombsInGF}/${_fieldAmount-_bombsInGF}`;
    
    _currentBoardRowAndCol = boardRowAndCol;
    let bombList = initBombList(maxRows, maxColumns);
    _setFlags = 0;
    _uncoveredFields = 0;
    
    _gameBoard.className = "";
    _gameBoard.style.gridTemplateColumns = `repeat(${maxColumns}, auto`;

    //clear boards
    _board = [];
    _gameBoard.innerHTML = "";
    for (let r = 0; r < maxRows; r++) {
        _board[r] = [];

        for (let c = 0; c < maxColumns; c++) {
            //init a field and pass its row, column and if its a bomb
            let isBomb = bombList.pop();
            const fieldObj = new Field(r, c, isBomb);
            _board[r][c] = fieldObj;
        }   
    }

    setFieldNumbers(maxRows, maxColumns);
}

//creates a list that contains all bombs of the board
function initBombList(rows, cols) {
    let tmpBombs = _bombsInGF;
    let boardSize = rows * cols;
    let bombList = [];

    //set the correct amount of bombs within the boardSize first try
    for (let i = 0; i < boardSize; i++) {
        let rand = Math.floor(Math.random() * _fracNumBombs);
    
        if (rand == 3 && tmpBombs > 0) {
            bombList[i] = true;
            tmpBombs--;
        }
        else {
            bombList[i] = false;
        }
    }

    //put in more bombs in case the borad is missing some
    while (tmpBombs > 0) {
        let rand = Math.floor(Math.random() * boardSize-1);
        if (!bombList[rand]) {
            bombList[rand] = true;
            tmpBombs--;
        }
    }
    return bombList;
}

//sets the bomb number of each field by checking if the surrounding fields are bombs
function setFieldNumbers(maxRows, maxColumns) {
    _board.forEach((row) => {
        row.forEach((fieldObj) => {
                //ignore bombs since they shouldnt have numbers
                if (fieldObj.isBomb) {
                    createFieldElement(fieldObj);
                    return;
                }

                let neighboringBombs = 0;
                let rowForNeighbors = 0;
                
                //will check the rows between the current field (row-1 = upper field, row+1 = lower field)
                for (let r = fieldObj.row-1; r < fieldObj.row+2; r++) {
                    //prevent going outside of the board index
                    if (r < 0 || r > maxRows-1) {
                        continue;
                    }
                    fieldObj.neighbors[rowForNeighbors] = [];
                    let colForNeighbors = 0;

                    //will check the columns beside the current field (col-1 = left field, col+1 = right field)
                    for (let c = fieldObj.column-1; c < fieldObj.column+2; c++) {
                        //prevent going outside of the board index
                        if (c < 0 || c > maxColumns-1) {
                            continue;
                        }

                        const neighbor = _board[r][c];
                        fieldObj.neighbors[rowForNeighbors][colForNeighbors] = neighbor;
                        neighboringBombs = neighbor.isBomb ? neighboringBombs+1 : neighboringBombs
                        colForNeighbors++;
                    }
                    rowForNeighbors++;
                }
                
                fieldObj.neighboringBombs = neighboringBombs == 0 ? _noNeighboringBombs : neighboringBombs;
                createFieldElement(fieldObj);
            })
    })
}

//creates a new HTMLElementButtom for a single field
function createFieldElement(fieldObj) {
    let fieldEl = document.createElement("button");
    fieldEl.className = "field";
    
    fieldEl.onclick = () => fieldClicked(fieldObj);
    fieldEl.oncontextmenu = (e) => setFlag(e, fieldObj);
    fieldEl.onmouseenter = () => onFieldEnter(fieldObj);
    fieldEl.onmouseleave = () => onFieldLeave(fieldObj);

    fieldObj.htmlElement = fieldEl;
    _gameBoard.append(fieldEl);
}

//highlight the neigbors of an uncovered field by adding a classname
function onFieldEnter(fieldObj) {
    //only neighbors of uncovered fields should be marked
    if (!fieldObj.isRevealed) {
        return;
    }

    fieldObj.neighbors.forEach((fieldRows) => {
        fieldRows.forEach((neighbor) => {
            //ignore uncovered and flagged neighbors since they wont be affected by chording
            if (neighbor.isRevealed || neighbor.isFlagged) {
                return;
            }

            if (!neighbor.htmlElement.className.includes(" hovering")) {
                neighbor.htmlElement.className += " hovering";
            }
        })
    })
}

//remove a classname of the neighbors from an uncovered field so its not highlighted anymore
function onFieldLeave(fieldObj) {
    //ignore covered fields since their neigbors wont be marked
    if (!fieldObj.isRevealed) {
        return;
    }

    fieldObj.neighbors.forEach((fieldRows) => {
        fieldRows.forEach((neighbor) => {
            //ignore uncovered and flagged neighbors since they wont be marked
            if (neighbor.isRevealed || neighbor.isFlagged) {
                return;
            }

            if (neighbor.htmlElement.className.includes(" hovering")) {
                neighbor.htmlElement.className = neighbor.htmlElement.className.substring(
                    0, neighbor.htmlElement.className.length- " hovering".length);
            }
        })
    })
}

//will reveal the clicked field and performs a specific action based on its attributes
function fieldClicked(fieldObj) {
    if (fieldObj.isFlagged) {
        return;
    }
    else if (fieldObj.isBomb) {
        revealBoard(false);
        changeTitles("Game Over!", ["You lost the game!", "Better luck next time", "Stay determined!"]);
        return;
    }
    // player wants to use chord
    else if(fieldObj.isRevealed) {
        fieldChord(fieldObj);
        return;
    }

    fieldObj.isRevealed = true;
    fieldObj.htmlElement.textContent = fieldObj.neighboringBombs;
    fieldObj.htmlElement.className = fieldObj.neighboringBombs == _noNeighboringBombs ? "empty field" : "field";
    changeBoardProgress();
    
    if (fieldObj.neighboringBombs == _noNeighboringBombs) {
        uncoverNeighboringFields(fieldObj);
    }

    if (isGameFinished()) {
        revealBoard(true);
        changeTitles("Board Finished!", ["Awesome!", "Congrats!!", "Amazing!!!"]);
        return;
    }
}

//uncover neighbors if the flags on the neighbors is equal/greater than the neigboring bombs
function fieldChord(fieldObj) {
    let flaggedNeighbors = 0;
    fieldObj.neighbors.forEach((fieldRows) => {
        fieldRows.forEach((neighbor) => {
            //ignore self
            if (neighbor === fieldObj) {
                return;
            }
            flaggedNeighbors = neighbor.isFlagged ? flaggedNeighbors+1 : flaggedNeighbors;
        })
    })

    //check if theres a correct amount of flags placed around it
    if (flaggedNeighbors >= fieldObj.neighboringBombs){
            fieldObj.neighbors.forEach((fieldRows) => {
                fieldRows.forEach((neighbor) => {
                    //ignore self, uncovered and flagged fields
                    if (neighbor === fieldObj || neighbor.isRevealed || neighbor.isFlagged) {
                        return;
                    }
                    
                    //uncover neigbors
                    fieldClicked(neighbor);
                })
        })
    }
}

function changeBoardProgress() {
    _uncoveredFields++;
    _boardProgress.textContent = `Covered fields: ${(_fieldAmount - _bombsInGF) -_uncoveredFields}/${_fieldAmount - _bombsInGF}`;
}

//uncovers neighbors if the current field has no neigboring bombs
function uncoverNeighboringFields(fieldObj) {
    fieldObj.htmlElement.onclick = ( ) => { };
    fieldObj.htmlElement.oncontextmenu = (cursor) => {
        cursor.preventDefault();
    }; 

    fieldObj.neighbors.forEach((fieldRows) => {
        fieldRows.forEach((neighbor) => {
            //ignore self and uncovered fields
            if (neighbor === fieldObj || neighbor.isRevealed) {
                return;
            }
            neighbor.isRevealed = true;
            neighbor.htmlElement.className = "field";
            neighbor.htmlElement.textContent = neighbor.neighboringBombs;
            changeBoardProgress();

           //give player their flag back
            if (neighbor.isFlagged) {
                _setFlags--;
                neighbor.isFlagged = false;
                _remainingFlags.textContent = `Remaining flags: ${_bombsInGF-_setFlags}/${_bombsInGF}`;
            }

            //continue uncovering fields that have no bombs as neigbors!!!
            if (neighbor.neighboringBombs == _noNeighboringBombs) {
                neighbor.htmlElement.className = "empty field";
                uncoverNeighboringFields(neighbor);
            }
        })
    })
}

//changes both title and subtitle
function changeTitles(titleText, subtitleText) {
    let title = document.getElementById("title");
    let subtitle = document.getElementById("subtitle");

    title.textContent = titleText;
    subtitle.textContent = subtitleText[Math.floor(Math.random() * subtitleText.length)];
}

//iterates through the entire board to check if all non bomb fields have been revealed (game is finished)
function isGameFinished() {
    let isFinished = true;

    _board.forEach((row) => {
        row.forEach((fieldObj) => {
                //ignore bombs since they shouldnt be uncovered to win
                if (fieldObj.isBomb) {
                    return;
                }
                isFinished = fieldObj.isRevealed ? isFinished : false;
            })
        })

    return isFinished;
}

//this reveals all fields and disable clicking on them
//will only be called when the game is finished or lost
function revealBoard(wonGame) {
    _gameBoard.className = wonGame ? _gameBoard.className+"won" : _gameBoard.className; 
    _lossStreakCount = wonGame ? 0 : _lossStreakCount+1;

    _board.forEach((row) => {
        row.forEach((fieldObj) => {
            const fieldEl = fieldObj.htmlElement;
            
            fieldEl.onclick = ( ) => { };
            fieldEl.oncontextmenu = ( ) => { };
            fieldEl.onmouseenter = ( ) => { };

            fieldEl.textContent = fieldObj.isBomb ? "💣" : fieldObj.neighboringBombs;
            fieldEl.className = "field";
            fieldEl.className = fieldObj.neighboringBombs == _noNeighboringBombs ? "empty field" : fieldEl.className;
            fieldEl.className = wonGame ? fieldEl.className+" won-game finished" : fieldEl.className+" finished";
        })
    });
}

function setFlag(cursor, fieldObj) {
    cursor.preventDefault();

    if (fieldObj.isRevealed) {
        return;
    }

    //remove the flag
    if (fieldObj.isFlagged) {
        _setFlags--;
        fieldObj._isFlagged = false;
        fieldObj.htmlElement.textContent = "";
    }
    //only add a flag if the amount of set flags is lesser than the amount of bombs
    else if (_setFlags < _bombsInGF){
        _setFlags++;
        fieldObj._isFlagged = true;
        fieldObj.htmlElement.textContent = "🚩";
    }

    _remainingFlags.textContent = `Remaining flags: ${_bombsInGF-_setFlags}/${_bombsInGF}`;
}

//resets the game by refilling the board with the same fieldSize
function resetGame(newFieldSize) {
        changeTitles("Good luck!", [_lossStreakCount+1 + (_lossStreakCount+1 == 1 ? "st ":
                                                          _lossStreakCount+1 == 2 ? "nd " : 
                                                          _lossStreakCount+1 == 3 ? "rd " : "th ")+ "try's a charm"]);    setUpField(newFieldSize ?? _currentBoardRowAndCol); 
}

//accepts the custom size if its valid
function confirmCustomSize() {
    let customRow = parseInt(document.getElementById("customRow").value);
    let customColumn = parseInt(document.getElementById("customColumn").value);

    if (!(customRow > 4 && customRow < 100 &&
          customColumn > 4 && customColumn < 100)) {
        alert("Please choose a value between 5 and 99.");
        return;
    }
    changeTitles("Good luck!", [_lossStreakCount+1 + (_lossStreakCount+1 == 1 ? "st ":
                                                      _lossStreakCount+1 == 2 ? "nd " : 
                                                      _lossStreakCount+1 == 3 ? "rd " : "th ")+ "try's a charm"]);
    setUpField(`${customRow}x${customColumn}`);
}