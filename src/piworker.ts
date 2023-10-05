import type { FenMoves, FenPattern } from './pi.ts'
import { play_tuples, pattern as pi_pattern } from 'pichess24'

type WorkerMsg = { id: string, fen_moves: FenMoves | FenPattern }

function is_fen_moves(_: FenMoves | FenPattern): _ is FenMoves {
  return (_ as FenMoves).moves !== undefined
}

onmessage = (e: MessageEvent<WorkerMsg>) => {
  let id = e.data.id

  if (is_fen_moves(e.data.fen_moves)) {
    let fen = e.data.fen_moves.fen
    let moves = e.data.fen_moves.moves
    postMessage({id, result: play_tuples(fen, moves)})
  } else {

    let fen = e.data.fen_moves.fen
    let pattern = e.data.fen_moves.pattern

    postMessage({id, result: pi_pattern(fen, pattern) })
  }


}

