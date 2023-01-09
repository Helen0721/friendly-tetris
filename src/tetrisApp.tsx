import React from 'react';
import './tetrisApp.css';
import 'antd/dist/reset.css';
import {InputNumber} from 'antd';
import {DownOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';

const levels = {'easy': 600, 'medium': 500, 'hard':400, 'expert': 300};
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
  
function Cell(props: CellProps): JSX.Element {
  const fill = props.value===''? 'white' : props.value;
  return(
    <div className="Cell"
      style = {{backgroundColor: fill}}> </div>
  );
}

class Board extends React.Component<BoardProps, BoardState>{
    constructor(props: BoardProps){
      super(props);
      this.state ={
        boardState: new Array<string>(props.rows*props.cols).fill(''),
        
        piece: undefined,
        pieceLeftCol: -1,
        pieceTopRow: -1,
        pieceColor: '',

        
        gameOver: false,
        paused: true,
        darkMode: true,
        score: 0,
        rows: this.props.rows,
        cols: this.props.cols,
        level: 'medium',
      };
      this.onKeyPressWrapper = this.onKeyPressWrapper.bind(this);
      this.handleDarkMode = this.handleDarkMode.bind(this);
      this.movePiece = this.movePiece.bind(this);
      document.body.classList.add('dark');
    }

    newGame(){
      clearInterval(nIntervId);
      this.setState({boardState: new Array<string>(this.state.rows*this.state.cols).fill(''), 
                      piece: undefined,
                      pieceLeftCol: -1,
                      pieceTopRow: -1,
                      pieceColor: '',
                      gameOver: false, 
                      paused: true, 
                      score: 0})
    }

    componentDidMount(): void {
      document.addEventListener('keydown', this.onKeyPressWrapper);
    }

    componentWillUnmount(): void {
      document.removeEventListener('keydown',this.onKeyPressWrapper);
      clearInterval(nIntervId);
    }

    onKeyPressWrapper(e: KeyboardEvent): void{
      this.onKeyPress(e.key);
    }

    onKeyPress(key: string): void{
      //console.log(key);
      if (key==='n' || key==='N') this.newGame();
      else if (this.state.gameOver) return;
      //else if (key==='0' || key==='1'||key==='2'||key==='3'||key==='4' || key==='5' || key==='6') {
      //  this.loadNewPiece(this.state.boardState,Number(key),true); 
      //}
      else if (key === ' ') this.handlePause();
      else if (key==='s' || key==='S') this.takeStep();
      else if(this.state.piece===undefined) return;
      else if (key ==='Enter') this.handleMovePiece(true,1,0);
      else if (key==='ArrowDown') this.handleMovePiece(false,1,0);
      else if (!this.movePiece(1,0)[0]) return;
      else if (key==='ArrowLeft') this.handleMovePiece(false,0,-1);
      else if (key==='ArrowRight') this.handleMovePiece(false,0,1);
      else if (key==='ArrowUp') this.rotatePieceClockwise();
  }

    handlePause(): void{
      if (this.state.paused){
        nIntervId = setInterval(()=>this.takeStep(),levels[this.state.level]) as unknown as number;
      }
      else clearInterval(nIntervId);
      this.setState({paused: !this.state.paused});
    }

    handleDarkMode(): void{
      if (this.state.darkMode) document.body.classList.remove('dark');
      else document.body.classList.add('dark');
      this.setState({darkMode: !this.state.darkMode});
    }

    handleMovePiece(repeat: boolean, drow: number, dcol: number): boolean{
      let [canMove,newLeftCol, newTopRow] = this.movePiece(drow,dcol);
      if (repeat && canMove) {
        this.setState({pieceLeftCol: newLeftCol, pieceTopRow: newTopRow}, ()=>this.handleMovePiece(repeat, drow,dcol));
        return true;
      }
      else if(canMove) {
        this.setState({pieceLeftCol: newLeftCol, pieceTopRow: newTopRow});
        return true;
      }
      return false;
    }

    movePiece(drow: number, dcol: number): [boolean, number, number] {
      if (this.state.piece===undefined) return [false, -1, -1];
      //console.log('piece old position:', this.state.pieceLeftCol, this.state.pieceTopRow);
      const piece = this.state.piece.slice() as boolean[][];
      let [newLeftCol, newTopRow]= [this.state.pieceLeftCol+dcol, this.state.pieceTopRow+drow];
      //console.log('new piece position:', newLeftCol, newTopRow);
      if (!this.moveIsLegal(piece,newLeftCol, newTopRow)) return [false, -1,-1];
      return [true, newLeftCol, newTopRow];
    }

    loadNewPiece(): void{
      if (this.state.gameOver) return;
      const i = Math.floor(Math.random()*this.props.tetrisPieces.length);
      const newPiece: boolean[][]= this.props.tetrisPieces[i];
      const fill = this.props.tetrisPieceColors[i];
      const leftCol = Math.floor(this.state.cols/2) - Math.ceil(newPiece[0].length/2);
      this.setState({piece: newPiece, pieceColor: fill, pieceLeftCol: leftCol, pieceTopRow: 0});
    }

    takeStep(){
      //console.log('taking step');
      if(this.state.piece===undefined) this.loadNewPiece();
      if(!this.handleMovePiece(false,1,0)) {
        this.handlePlacePiece();
        if(!this.state.gameOver) this.loadNewPiece();
      }
    }

    handlePlacePiece(): void{
      if (this.state.piece===undefined) return;
      const board = [...this.state.boardState];
      const piece = this.state.piece as boolean[][];
      for (let row = 0; row < piece.length; row++){
        for (let col = 0; col< piece[0].length; col++){
          let idxInBoard = rc_idx(row+this.state.pieceTopRow,col+this.state.pieceLeftCol,this.state.cols);
          if (piece[row][col]) board[idxInBoard] = this.state.pieceColor;
        }
      }
      this.setState({boardState: board}, ()=>this.clearFullRow());
    }

    clearFullRow(){
      //console.log("clearing full row");
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
      if (cntFullRow!=0){

      }
      //console.log('Cleared board:',board);
      // const weight = scoreWeights[this.state.level];
      //console.log("weight", weight);
      const addedScores = [0,10,30,50,80,120,160,220];
      this.setState({boardState: board, score: this.state.score+addedScores[cntFullRow]}, ()=>this.checkGameOver());
    }

    checkGameOver():void{
      for(let col = 0; col< this.state.cols; col++) {
        if (this.state.boardState[col]!=='') {
          clearInterval(nIntervId);
          this.setState({gameOver: true});
          return;
        }
      }
   }

    rotatePieceClockwise() {
      if (this.state.piece===undefined) return;
      const [oldPiece, oldTopRow, oldLeftCol] = [this.state.piece, this.state.pieceTopRow, this.state.pieceLeftCol];
      const centerRow = oldTopRow + Math.floor(oldPiece.length/2);
      const centerCol = oldLeftCol + Math.floor(oldPiece[0].length/2);
      const[newRows, newCols] = [oldPiece[0].length, oldPiece.length];
      const newPiece = rotate2dListClockwise(oldPiece);
      const newTopRow = centerRow - Math.floor(newRows/2);
      const newLeftCol = centerCol - Math.floor(newCols/2);
      if (this.moveIsLegal(newPiece,newLeftCol, newTopRow)) this.setState({piece: newPiece, pieceLeftCol: newLeftCol, pieceTopRow: newTopRow});
    }
    moveIsLegal(piece: boolean[][], newLefCol: number, newTopRow: number){
      if (newTopRow + piece.length > this.state.rows) return false;
      if (newTopRow<0 || newLefCol<0) return false;
      for(let row = 0; row<piece.length; row++){
        for (let col = 0; col< piece[0].length; col++){
          let idxInBoard = rc_idx(row+newTopRow,col+newLefCol,this.state.cols);
          if (piece[row][col] && (col+newLefCol>=this.state.cols || 
                                  this.state.boardState[idxInBoard]!=='')) return false;
        }
      }
      return true;
    }
    
    renderBoard(): JSX.Element[]{
      //console.log('renderBoard...');
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

        //console.log('render piece...');
        const piece = this.state.piece
        if (piece!==undefined){
          for (let r =0; r<piece.length; r++){
            for (let c = 0; c<piece[0].length; c++){
              if(piece[r][c]){
                let idxInBoard = rc_idx(r+this.state.pieceTopRow, c+this.state.pieceLeftCol, this.state.cols);
                let cell = <Cell
                  value = {this.state.pieceColor}
                  key = {idxInBoard.toString() + this.state.pieceColor}/>
                cells[idxInBoard] = cell;
              }
            }
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
                              onMouseDown= {()=>this.handleDarkMode()}
                              onMouseUp = {()=>{}}
                              > {colorMode} </button>
                    </div>
                  <div className = 'NewGame'>
                    <button className = 'NewGameButton'
                        onMouseDown = {()=>this.newGame()}
                        onMouseUp = {()=>{}}>
                            Click or Press 'n' or 'N' for new game
                    </button>
                  </div>
                  <div className = 'HandlePause'>
                    <button className = 'HandlePauseButton'
                      onMouseDown = {()=>{this.handlePause()}}
                      onMouseUp = {()=>{}}
                      >
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

export default class TetrisApp extends React.Component<{},{}>{

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
  }
}