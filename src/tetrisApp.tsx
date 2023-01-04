import React, { useEffect } from 'react';
import './tetrisApp.css';

let handlerDidMount = false;
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
        style = {{backgroundColor: `${fill}`}}> </div>
    );
}

class Board extends React.Component<BoardProps, BoardState>{
    piece: boolean[][]|undefined;
    pieceLeftCol: number
    pieceTopRow: number;
    pieceColor: string;
    paused: boolean;
    constructor(props: BoardProps){
      super(props);
      this.state ={
        boardState: new Array<string>(props.rows*props.cols).fill(''),
        gameOver: false,
        paused: true,
        darkMode: true,
      };
      this.piece = undefined;
      this.pieceLeftCol = -1;
      this.pieceTopRow = -1;
      this.pieceColor = '';
      this.paused = true;
    }

    newGame(){
        clearInterval(nIntervId);
        this.setState({boardState: new Array<string>(this.props.rows*this.props.cols).fill(''), gameOver: false, paused: true})
        this.piece = undefined;
        this.pieceLeftCol = -1;
        this.pieceTopRow = -1;
        this.pieceColor = '';
        this.paused = false;
    }

    componentDidMount(): void {
        if (!handlerDidMount){
          this.onKeyPress();
          handlerDidMount = true;
        }
    }

    onKeyPress(): void{
        document.addEventListener('keydown',(e)=>
          {
            e.preventDefault();
            if (e.key==='n' || e.key==='N') this.newGame();
            else if (this.state.gameOver) return;
            else if (e.key==='0' || e.key==='1'||e.key==='2'||e.key==='3'||e.key==='4' || e.key==='5' || e.key==='6') {
              this.loadNewPiece(this.state.boardState,Number(e.key),true); 
            }
            else if (e.key==='s' || e.key==='S') this.takeStep();
            else if (e.key ==='Enter') this.handleMovePiece(true, 1,0);
            else if (e.key === ' ') {
              console.log("space bar pressed");
              this.handlePause();
            }
            else if(this.piece===undefined) return;
            else if (e.key==='ArrowDown') this.handleMovePiece(false, 1,0);
            else if (!this.movePiece(1,0)[0]) return;
            else if (e.key==='ArrowLeft') this.handleMovePiece(false,0,-1);
            else if (e.key==='ArrowRight') this.handleMovePiece(false,0,1);
            else if (e.key==='ArrowUp') this.handleRotatePiece();
          }
        )
        document.body.classList.add('dark');
    }

    handleDarkMode(): void{
      if (this.state.darkMode) document.body.classList.remove('dark');
      else document.body.classList.add('dark');
      this.setState({darkMode: !this.state.darkMode});
    }

    // componentDidUpdate(prevProps: Readonly<BoardProps>, prevState: Readonly<BoardState>, snapshot?: any): void {
    //   if(prevState.darkMode!==this.state.darkMode) console.log('dark mode changed');
    //   if(prevState.boardState!==this.state.boardState) console.log('board changed');
    // }

    handlePause(): void{
      console.trace();
      console.log("handlePause...");
      console.log("game paused", this.state.paused, "timerID:", nIntervId);
      if (this.state.paused) nIntervId = setInterval(()=>this.takeStep(),500) as unknown as number;
      else clearInterval(nIntervId);
      console.log("(new) timer Id:",nIntervId);
      this.setState({paused: !this.state.paused});
    }

    clearPrevPiece(boardState: string[]): string[]|undefined {
      //console.log("clearing piece",this.piece);
        const board = [...boardState];
        if (board===undefined) return undefined;
        const oldPiece = this.piece as boolean[][];
     
        for (let row = 0; row < oldPiece.length; row++){
            for (let col = 0; col< oldPiece[0].length; col++){
                let idxInBoard = rc_idx(row+this.pieceTopRow,col+this.pieceLeftCol,this.props.cols);
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
        const leftCol = Math.floor(this.props.cols/2) - Math.ceil(newPiece[0].length/2);
        const topRow = 0;
    
        for (let row = 0; row < newPiece.length; row++){
          for (let col = 0; col< newPiece[0].length; col++){
            let idxInBoard = rc_idx(row+topRow,col+leftCol,this.props.cols);
            if (newPiece[row][col]) board[idxInBoard] = fill;
          }
        }
        [this.piece, this.pieceLeftCol, this.pieceTopRow, this.pieceColor]= [newPiece, leftCol, topRow, fill];
        this.setState({boardState: board});
    }

    takeStep(){
      //console.log('taking step');
        if(this.piece===undefined) this.loadNewPiece(this.state.boardState,-1, false);
        else{
            const canMoveCurrPiece = this.handleMovePiece(false,1,0);
            if(!canMoveCurrPiece){
                const board = this.clearFullRow();
                const isGameOver = this.checkGameOver(board);
                if (isGameOver) clearInterval(nIntervId);
                else this.loadNewPiece(board,-1, false);
                this.setState({gameOver: isGameOver});
            }
        }
    }

    clearFullRow(){
      console.log("clearing full row");
        let row = this.props.rows-1;
        let board = this.state.boardState.slice();
        //const emptyRow = new Array<string>(this.props.cols).fill('');
        const rowIsFull = (row: number) => {
            for (let col = 0; col<this.props.cols;col++){ 
                if (board[rc_idx(row,col,this.props.cols)] === '') return false;
            }
            return true;
        };
        while (row>-1){
          if (rowIsFull(row)){
            let startIdx = rc_idx(row,0,this.props.cols);
            board.splice(startIdx,this.props.cols);
            for(let i = 0; i<this.props.cols; i++) board.unshift('');
          }
          else row--;
          //console.log(row);
        }
        //console.log('Cleared board:',board);
        return board;
    }

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
                let idxInBoard = rc_idx(row+newTopRow,col+newLeftCol,this.props.cols);
                if (this.piece[row][col]) board[idxInBoard] = this.pieceColor;
          }
        }
        return [true, board, newLeftCol, newTopRow];
    }

    checkGameOver(board: string[]): boolean{
        for(let col = 0; col< this.props.cols; col++) {
            if (board[col]!=='') return true;
        }
        return false;
    }

    moveIsLegal(board: string[], piece: boolean[][], leftCol: number, topRow: number): boolean{
        if (topRow + piece.length > this.props.rows) return false;
        if (topRow<0 || leftCol<0) return false;
        for(let row = 0; row<piece.length; row++){
          for (let col = 0; col< piece[0].length; col++){
            let idxInBoard = rc_idx(row+topRow,col+leftCol,this.props.cols);
            if (piece[row][col] && (col+leftCol>=this.props.cols || 
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
                    let idxInBoard = rc_idx(row+newTopRow,col+newLeftCol,this.props.cols);
                    if (newPiece[row][col]) board[idxInBoard] = this.pieceColor;
                }
            }
            return [board,newPiece,newLeftCol,newTopRow];
        }
        return [undefined,[],-1,-1];
    }

    renderBoard(): JSX.Element[]{
        let cells = [];
    
        for(let r = 0; r < this.props.rows; r++){
            for (let c=0; c<this.props.cols; c++){
                let idx = rc_idx(r,c,this.props.cols);
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
        let fill;
        let headerFill = 'black';
        if (this.state.gameOver) [status,fill] = ['Game Over!','red'];
        else if (!this.state.paused) [status,fill] = ['Playing game',`#A61B29`];
        else{
          if (this.state.darkMode) [status,fill, headerFill] = ['Game paused',`#804d9e`, `#7090ca`];
          else [status,fill, headerFill] = ['Game paused','black',`#b95948`];
        }
        
        return( 
            <div> 
              <div className = "TetrisHeader" > {'Welcome to Tetris!'} </div>
              <button className = 'dark-mode-toggle'
                  onClick = {()=>this.handleDarkMode()}
                  > change color </button>
                <button className = 'newGame'
                    onClick = {()=>this.newGame()}
                    style = {{margin: `0.7em`, blockSize: '2em', color: 'green'}}>
                        Click or Press 'n' or 'N' for new game
                </button>
                <div>
                <button
                    onClick = {()=>{this.handlePause()}}
                    style = {{margin: `0.7em`}}>
                            Click or Press spacebar to pause/unpause
                    </button>
                </div>
                <div style = {{color: fill, fontFamily: 'cursive', fontSize: `1.3em`}}> {status}</div>
                <div className = 'Board'
                style = {{gridTemplateColumns: `repeat(${this.props.cols}, 1.2fr)`, 
                          width: `${17 * 2 * this.props.cols}px`,
                          }}>
                {this.renderBoard()}
                </div>
            </div>
        )
    }
}

export default class TetrisApp extends React.Component{
    render(){
    const rows = 15;
    const cols = 10;
    const piecesInfo: tetrisPiecesOutput = loadPieces();

    return <div className="App">
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