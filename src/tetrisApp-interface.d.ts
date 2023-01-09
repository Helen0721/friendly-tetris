interface CellProps{
    value: string;
}

interface BoardProps{
    rows: number;
    cols: number;
    tetrisPieces: boolean[][][];  //Array of all tetris pieces
    tetrisPieceColors: string[];  //Color of each piece
}

const piecesColor = ''| 'red'| 'yellow' | 'magenta' | 'pink'| 'cyan'| 'green'| 'orange';

interface BoardState{
    boardState: pieceColor[];

    piece: undefined|boolean[][],
    pieceLeftCol: number,
    pieceTopRow: number,
    pieceColor: piecesColor,

    gameOver: boolean;
    paused: boolean;
    darkMode: boolean;
    score: number;
    rows: number;
    cols: number;
    //level: string;
    level: 'easy'| 'medium' | 'hard' | 'expert';
}

interface GameState{
    // score: number;
    // gameOver: boolean;
    // paused: boolean;
    darkMode: boolean;
}

type tetrisPiecesOutput = [boolean[][][], string[]];

interface movePiece{
    drow: -1|0|1;
    dcol: -1|0|1;
}