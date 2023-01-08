import React from 'react';
import './tetrisApp.css';
import 'antd/dist/reset.css';
import {InputNumber} from 'antd';
import {DownOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';

const levels = {'easy': 600, 'medium': 500, 'hard':400, 'expert': 300};
// let stateStillUpdating = true;
// function checkStateFinished(): void{
//   stateStillUpdating = true; 
// }

let nIntervId: number;

function loadPieces(): tetrisPiecesOutput{
    const iPiece = [[true, true, true, true]];
    const jPiece = [[true, false, false ],
                    [true, true, true ]];
    const lPiece =  [[ false, false,  true ],
                     [true, true, true ]];
    const oPiece = [[  true,  true ],
                    [  true,  true ]];
    const sPiece = [[ false,  true,  true ],
                    [  true,  true, false ]];
    const tPiece = [[ false,  true, false ],
                    [  true,  true,  true ]];
    const zPiece = [[  true,  true, false ],
                    [ false,  true,  true ]];
    const tetrisPieces = [iPiece, jPiece, lPiece, oPiece,
                    sPiece, tPiece, zPiece];
    const tetrisPieceColors = [ 'red', 'yellow', 'magenta', 'pink',
                    'cyan', 'green', 'orange' ];
    return [tetrisPieces, tetrisPieceColors];
}

function rc_idx(curr_r: number, curr_c: number, cols: number){
  return (curr_r*cols + curr_c);
}

function rotate2dListClockwise(oldPiece: boolean[][]){
    let newPiece: boolean[][] = [];
    for (const col of oldPiece[0]) newPiece.push([]);
    for (let newRow = 0; newRow < newPiece.length; newRow++){
      for (const row of oldPiece) newPiece[newRow].push(false);
    }
  
    for (let oldRow = 0; oldRow<oldPiece.length; oldRow++) {
      for (let oldCol = 0; oldCol<oldPiece[0].length; oldCol++){
        let [newRow, newCol] = [oldCol, oldPiece.length-oldRow-1];
        newPiece[newRow][newCol] = oldPiece[oldRow][oldCol];
      }
    }
    return newPiece;
}
  
function getNextPieceIndex(piecesTotalNum: number): number{
    return Math.floor(Math.random()*piecesTotalNum);
}

function Cell(props: CellProps): JSX.Element {
    const fill = props.value===''? 'white' : props.value;
    return(
      <div className="Cell"
        style = {{backgroundColor: fill}}> </div>
    );
}

class Board extends React.Component<BoardProps, BoardState>{
    piece: boolean[][]|undefined;
    pieceLeftCol: number
    pieceTopRow: number;
    pieceColor: string;
    constructor(props: BoardProps){
      super(props);
      this.state ={
        boardState: new Array<string>(props.rows*props.cols).fill(''),
        gameOver: false,
        paused: true,
        darkMode: true,
        score: 0,
        rows: this.props.rows,
        cols: this.props.cols,
        level: 'easy',
      };
      this.piece = undefined;
      this.pieceLeftCol = -1;
      this.pieceTopRow = -1;
      this.pieceColor = '';
      this.onKeyPressWrapper = this.onKeyPressWrapper.bind(this);
      this.handleDarkMode = this.handleDarkMode.bind(this);
      document.body.classList.add('dark');
    }

    newGame(){
        clearInterval(nIntervId);
        this.setState({boardState: new Array<string>(this.state.rows*this.state.cols).fill(''), gameOver: false, paused: true, score: 0})
        this.piece = undefined;
        this.pieceLeftCol = -1;
        this.pieceTopRow = -1;
        this.pieceColor = '';
    }

    componentDidMount(): void {
      //console.log("mount board");
      document.addEventListener('keydown', this.onKeyPressWrapper);
    }

    componentWillUnmount(): void {
      //console.log("unmount board");
      document.removeEventListener('keydown',this.onKeyPressWrapper);
      clearInterval(nIntervId);
    }

    onKeyPressWrapper(e: KeyboardEvent): void{
      if (e.key===' '|| e.key==='enter') e.preventDefault();
      this.onKeyPress(e.key);
    }

    onKeyPress(key: string): void{
      // console.log(key);
      if (key==='n' || key==='N') this.newGame();
      else if (this.state.gameOver) return;
      //else if (key==='0' || key==='1'||key==='2'||key==='3'||key==='4' || key==='5' || key==='6') {
      //  this.loadNewPiece(this.state.boardState,Number(key),true); 
      //}
      else if (key==='s' || key==='S') this.takeStep();
      else if (key ==='Enter') this.handleMovePiece(true, 1,0);
      else if (key === ' ') this.handlePause();
      else if(this.piece===undefined) return;
      else if (key==='ArrowDown') this.handleMovePiece(false, 1,0);
      else if (!this.movePiece(1,0)[0]) return;
      else if (key==='ArrowLeft') this.handleMovePiece(false,0,-1);
      else if (key==='ArrowRight') this.handleMovePiece(false,0,1);
      else if (key==='ArrowUp') this.handleRotatePiece();
  }

    handlePause(): void{
      // console.trace();
      // console.log("handlePause...");
      // console.log("game paused", this.state.paused, "timerID:", nIntervId);

      if (this.state.paused){
         
        nIntervId = setInterval(()=>this.takeStep(),levels[this.state.level]) as unknown as number;
      }
      else {
        // console.log("pause game");
        clearInterval(nIntervId);
      }
      this.setState({paused: !this.state.paused});
      // console.log("(new) timer Id:",nIntervId);
      // this.props.updatePause();
    }

    handleDarkMode(): void{
      if (this.state.darkMode) document.body.classList.remove('dark');
      else document.body.classList.add('dark');
      this.setState({darkMode: !this.state.darkMode});
    }

    clearPrevPiece(boardState: string[]): string[]|undefined {
      //console.log("clearing piece",this.piece);
        const board = [...boardState];
        if (board===undefined) return undefined;
        const oldPiece = this.piece as boolean[][];
     
        for (let row = 0; row < oldPiece.length; row++){
            for (let col = 0; col< oldPiece[0].length; col++){
                let idxInBoard = rc_idx(row+this.pieceTopRow,col+this.pieceLeftCol,this.state.cols);
                if (oldPiece[row][col]) board[idxInBoard] = '';
           }
        }
        return board;
    }

    loadNewPiece(boardState: string[], nextPieceIndex: number, clear: boolean): void{
        if (this.state.gameOver) return;
        let board;
        //console.log("clear",clear);
        const i = nextPieceIndex===-1? getNextPieceIndex(this.props.tetrisPieces.length): nextPieceIndex;
        if (clear && this.piece!==undefined) {
          board = this.clearPrevPiece(boardState) as string[];
        } else{
          board = boardState.slice() as string[];
        }
        const newPiece: boolean[][]= this.props.tetrisPieces[i];
        const fill = this.props.tetrisPieceColors[i];
        const leftCol = Math.floor(this.state.cols/2) - Math.ceil(newPiece[0].length/2);
        const topRow = 0;
    
        for (let row = 0; row < newPiece.length; row++){
          for (let col = 0; col< newPiece[0].length; col++){
            let idxInBoard = rc_idx(row+topRow,col+leftCol,this.state.cols);
            if (newPiece[row][col]) board[idxInBoard] = fill;
          }
        }
        [this.piece, this.pieceLeftCol, this.pieceTopRow, this.pieceColor]= [newPiece, leftCol, topRow, fill];
        this.setState({boardState: board});
    }

    takeStep(){
      // console.log('taking step');
      if(this.piece===undefined) this.loadNewPiece(this.state.boardState,-1, false);
      else{
          const canMoveCurrPiece = this.handleMovePiece(false,1,0);
          if(!canMoveCurrPiece){
              const board = this.clearFullRow();
              const isGameOver = this.checkGameOver(board);
              if (isGameOver) clearInterval(nIntervId);
              else this.loadNewPiece(board,-1, false);  //setState is called in loadNewPiece
              this.setState({gameOver: isGameOver});
          }
      }
    }

    clearFullRow(){
      // console.log("clearing full row");
      let row = this.state.rows-1;
      let board = this.state.boardState.slice();
      let cntFullRow = 0;
      //const emptyRow = new Array<string>(this.state.cols).fill('');
      const rowIsFull = (row: number) => {
          for (let col = 0; col<this.state.cols;col++){ 
              if (board[rc_idx(row,col,this.state.cols)] === '') return false;
          }
          return true;
      };
      while (row>-1){
        if (rowIsFull(row)){
          let startIdx = rc_idx(row,0,this.state.cols);
          board.splice(startIdx,this.state.cols);
          for(let i = 0; i<this.state.cols; i++) board.unshift('');
          cntFullRow += 1;
        }
        else row--;
        //console.log(row);
      }
      //console.log('Cleared board:',board);
      const weight = 1;
      const addedScores = [0,10,30,50,80,120,160,220];
      this.setState({score: this.state.score+addedScores[cntFullRow]*weight});
      //score += cnt * 10 * weight(easy: 1, medium: 1.2, hard: 1.5)
      return board;
    }
    // componentDidUpdate(prevProps: BoardProps, prevState: BoardState){
    //   console.log(prevState.boardState, this.state.boardState);
    // }

    handleMovePiece(repeat: boolean, drow:number,dcol:number): boolean{
        //console.log("handleMovePiece...");
        let [canMove, board, newLeftCol, newTopRow] = this.movePiece(drow,dcol);
        //console.log(canMove, drow, dcol);
        if (canMove && repeat){
            [this.pieceLeftCol, this.pieceTopRow] = [newLeftCol, newTopRow];
            this.setState({boardState: board},()=>this.handleMovePiece(repeat,drow,dcol));
            return true;
        }
        else if(canMove) {
            [this.pieceLeftCol, this.pieceTopRow] = [newLeftCol, newTopRow];
            this.setState({boardState: board});
            return true;
        }
        //console.log("returning false");
        return false;
    }

    handleRotatePiece(){
        const[board,newPiece,newLeftCol,newTopRow] = this.rotatePieceClockwise();
        if (board!==undefined) {
            [this.piece, this.pieceLeftCol, this.pieceTopRow] = [newPiece, newLeftCol, newTopRow];
            this.setState({boardState:board});
        }
    }

    movePiece(drow: number, dcol: number): [boolean, string[], number, number] {
        if (this.piece===undefined) return [false, [], -1, -1];
        const board = this.clearPrevPiece(this.state.boardState) as string[];
        let [newLeftCol, newTopRow]= [this.pieceLeftCol+dcol, this.pieceTopRow+drow];

        if (!this.moveIsLegal(board, this.piece, newLeftCol, newTopRow)) return [false, [], -1, -1];

        for (let row = 0; row < this.piece.length; row++){
            for (let col = 0; col< this.piece[0].length; col++){
                let idxInBoard = rc_idx(row+newTopRow,col+newLeftCol,this.state.cols);
                if (this.piece[row][col]) board[idxInBoard] = this.pieceColor;
          }
        }
        return [true, board, newLeftCol, newTopRow];
    }

    checkGameOver(board: string[]): boolean{
        for(let col = 0; col< this.state.cols; col++) {
            if (board[col]!=='') return true;
        }
        return false;
    }

    moveIsLegal(board: string[], piece: boolean[][], leftCol: number, topRow: number): boolean{
        if (topRow + piece.length > this.state.rows) return false;
        if (topRow<0 || leftCol<0) return false;
        for(let row = 0; row<piece.length; row++){
          for (let col = 0; col< piece[0].length; col++){
            let idxInBoard = rc_idx(row+topRow,col+leftCol,this.state.cols);
            if (piece[row][col] && (col+leftCol>=this.state.cols || 
                                    board[idxInBoard]!=='')) return false;
          }
        }
        return true;
    }

    rotatePieceClockwise(): [string[]|undefined,boolean[][], number,number]{
        if (this.piece===undefined) return[undefined,[],-1,-1];
        const [oldPiece, oldTopRow, oldLeftCol] = [this.piece, this.pieceTopRow, this.pieceLeftCol];
        const centerRow = oldTopRow + Math.floor(oldPiece.length/2);
        const centerCol = oldLeftCol + Math.floor(oldPiece[0].length/2);
        const[newRows, newCols] = [oldPiece[0].length, oldPiece.length];
        const newPiece = rotate2dListClockwise(oldPiece);
        const newTopRow = centerRow - Math.floor(newRows/2);
        const newLeftCol = centerCol - Math.floor(newCols/2);
        
        const board = this.clearPrevPiece(this.state.boardState) as string[];
    
        if (this.moveIsLegal(board,newPiece,newLeftCol, newTopRow)){
            for (let row = 0; row < newPiece.length; row++){
                for (let col = 0; col< newPiece[0].length; col++){
                    let idxInBoard = rc_idx(row+newTopRow,col+newLeftCol,this.state.cols);
                    if (newPiece[row][col]) board[idxInBoard] = this.pieceColor;
                }
            }
            return [board,newPiece,newLeftCol,newTopRow];
        }
        return [undefined,[],-1,-1];
    }

    renderBoard(): JSX.Element[]{
        let cells = [];
    
        for(let r = 0; r < this.state.rows; r++){
            for (let c=0; c<this.state.cols; c++){
                let idx = rc_idx(r,c,this.state.cols);
                let cell = <Cell 
                    value= {this.state.boardState[idx]} 
                    key = {idx.toString()+this.state.boardState[idx]}
                />
                cells.push(cell);
            }
        }
        return cells;
    }
    render(){
        let status;
        let statusFill;
        if (this.state.gameOver) [status,statusFill] = ['Game Over!','red'];
        else if (!this.state.paused) [status,statusFill] = ['Playing...',`#A61B29`];
        else [status,statusFill] = ['Game paused',`#804d9e`];
        const colorMode = this.state.darkMode? "dark mode" : "light mode";
        let borderWidth = 34*this.state.cols;
        const changeCols = (newCols: number|null) => {
          if (newCols!==null) {
            const newBoard = Array<string>(this.state.rows*newCols).fill('');
            borderWidth = 34*newCols+2;
            this.setState({boardState: newBoard, cols: newCols});
          }
        }

        const changeRows = (newRows: number|null) => {
          if (newRows!==null) {
            const newBoard = Array<string>(this.state.cols*newRows).fill('');
            this.setState({boardState: newBoard, rows: newRows});
          }
        }

        
        //  = (newLevel: 'easy'| 'medium' | 'hard' | 'expert') =>{
        //   console.log(newLevel);
        //   if (newLevel!=null) this.setState({level: newLevel});
        // }
        //const maxCols = Math.floor(window.innerWidth/2/34);
        
        const items: MenuProps['items'] = [
          {label: (<p>easy</p>), key: 'easy'},
          {label: (<p>medium</p>), key: 'medium'},
          {label: (<p>hard</p>), key: 'hard'},
          {label: (<p>expert</p>), key: "expert"},
        ]
        
        const handleLevelClick: MenuProps['onClick'] = (e) =>{
            const newLevel = e.keyPath[0] as 'easy'| 'medium' | 'hard' | 'expert';
            if (newLevel in levels) this.setState({level: newLevel});
        }

        const menuProps = {
          items,
          onClick: handleLevelClick,
        };

        return( 
            <div className = 'Tetris-body'>
                <div className = 'NavigationBar'>  
                  <div className = 'BoardSize'>
                    <div style = {{margin: 'auto 1em'}}>Columns:</div>
                    <InputNumber size ="small" min={5} max={25} defaultValue={this.state.cols} disabled = {!this.state.paused} onChange = {changeCols}></InputNumber>
                    <div style = {{margin: 'auto 1em'}}>Rows:</div>
                    <InputNumber size ="small" min={10} max={20} defaultValue={this.state.rows} disabled = {!this.state.paused} onChange = {changeRows}></InputNumber>
                                      
                  </div>
                  <div className = 'Level'>
                    <div style = {{margin: 'auto 1em'}}>Level:</div>
                    <Dropdown menu={menuProps} disabled = {!this.state.paused}>
                        <Button>
                          <Space>
                            {this.state.level}
                            <DownOutlined />
                          </Space>
                        </Button>
                    </Dropdown>  
                  </div>
                  
                  <div className = 'DarkModeButton'>
                    <button className = 'dark-mode-toggle'
                              onClick = {()=>this.handleDarkMode()}
                              > {colorMode} </button>
                    </div>
                  <div className = 'NewGame'>
                    <button className = 'NewGameButton'
                        onClick = {()=>this.newGame()}>
                            Click or Press 'n' or 'N' for new game
                    </button>
                  </div>
                  <div className = 'HandlePause'>
                    <button className = 'HandlePauseButton'
                      onClick = {()=>{this.handlePause()}}>
                              Click or Press spacebar to pause/unpause
                    </button>
                </div> 
              </div>
              <div className = 'Game'>
                <div className = 'GameStatus'
                    style = {{color: statusFill}}> {status} 
                </div>
                <div className = 'Score'> 
                        Score: {this.state.score}
                </div> 
                <div className = 'Board'
                      style = {{gridTemplateColumns: `repeat(${this.state.cols}, 1.2fr)`, 
                                width: `${borderWidth}px`,
                                }}>
                      {this.renderBoard()}
                </div>
            </div>
            </div>
        )
    }
}

export default class TetrisApp extends React.Component<{},GameState>{
  constructor(props: any){
    super(props);
    this.state={
      // score: 0,
      darkMode: true,
      // gameOver: false,
      // paused: true,
    };
    // this.updateScore = this.updateScore.bind(this);
    // this.handleDarkMode = this.handleDarkMode.bind(this);
    // this.updatePause = this.updatePause.bind(this);
    // document.body.classList.add('dark');
  }
  

  // updatePause(){
  //   this.setState({paused: !this.state.paused});
  // }

  // updateGameOver(){
  //   this.setState({paused: !this.state.gameOver});
  // }

  // updateScore(newScore: number){
  //   this.setState({score: this.state.score + newScore});
  // }

  // handleDarkMode(): void{
  //   if (this.state.darkMode) document.body.classList.remove('dark');
  //   else document.body.classList.add('dark');
  //   this.setState({darkMode: !this.state.darkMode});
  // }

    render(){
    const rows = 15;
    const cols = 10;
    const piecesInfo: tetrisPiecesOutput = loadPieces();
    
    return <div className="App">
        <div className = "TetrisHeader" > 
            {'Welcome to Tetris!'} 
        </div>
        <Board
          rows = {rows}
          cols = {cols}
          tetrisPieces = {piecesInfo[0]}
          tetrisPieceColors = {piecesInfo[1]}
          
        />
      </div>
    ;
  }
}