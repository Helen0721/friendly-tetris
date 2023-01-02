import React from 'react';
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
      };
      this.piece = undefined;
      this.pieceLeftCol = -1;
      this.pieceTopRow = -1;
      this.pieceColor = '';
      this.paused = false;
    }

    newGame(){
        clearInterval(nIntervId);
        this.setState({boardState: new Array<string>(this.props.rows*this.props.cols).fill(''), gameOver: false,})
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
            if (e.key==='r' || e.key==='R') this.newGame();
            else if (this.state.gameOver) return;
            else if (e.key==='0' || e.key==='1'||e.key==='2'||e.key==='3'||e.key==='4' || e.key==='5' || e.key==='6') {
              if (this.piece!==undefined) this.loadNewPiece(this.state.boardState,Number(e.key),false);
              else this.loadNewPiece(this.state.boardState,Number(e.key),true); 
            }
            else if (this.piece!==undefined && e.key==='ArrowDown') this.handleMovePiece(false, 1,0);
            else if (this.piece!==undefined && this.movePiece(1,0)[0] && e.key==='ArrowLeft') this.handleMovePiece(false,0,-1);
            else if (this.piece!==undefined && this.movePiece(1,0)[0] && e.key==='ArrowRight') this.handleMovePiece(false,0,1);
            else if (this.piece!==undefined && this.movePiece(1,0)[0] && e.key==='ArrowUp') this.handleRotatePiece();
            else if (this.piece!==undefined && e.key===' ') this.handleMovePiece(true,1,0);
            else if (e.key==='s' || e.key==='S') this.takeStep();
            else if (e.key === 'p'|| e.key==='P') {
              if (!this.paused) nIntervId = setInterval(()=>this.takeStep(),500) as unknown as number;
              else clearInterval(nIntervId);
              this.paused = !this.paused;
            };
          }
        )
    }

    clearPrevPiece(boardState: string[]): string[]|undefined {
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
        let [canMove, board, newLeftCol, newTopRow] = this.movePiece(drow,dcol);
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
        let [status, fill] = this.state.gameOver? ['Game Over!','red'] : ['Welcome to Tetris','black'];
        return( 
            <div> 
                <div className = "App-header" style = {{color: fill}}> {status} </div>
                <button 
                    onClick = {()=>this.newGame()}
                    style = {{margin: `2em`}}>
                        Click or Press 'r' or 'R' to restart
                </button>
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