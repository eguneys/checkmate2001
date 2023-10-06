import type { FenMoves, FenPattern } from './pi.ts'
import { flip_colors, play_tuples, pattern as pi_pattern } from 'pichess24'

type WorkerMsg = { 
  id: string, 
  fen_flips?: string[],
  fen_moves?: FenMoves[], 
  fen_patterns?: FenPattern[] 
}

onmessage = (e: MessageEvent<WorkerMsg>) => {
  let id = e.data.id

  if (e.data.fen_flips) {

    let result = e.data.fen_flips.map(fen => flip_colors(fen))
    postMessage({ id, result })
  } else if (e.data.fen_moves) {
    let result = e.data.fen_moves.map(({fen, moves}) => {
      return play_tuples(fen, moves) ?? 'undefined'
    })
    postMessage({ id, result })
  } else if (e.data.fen_patterns) {
    let result = e.data.fen_patterns.map(({fen, pattern}) => {
      return `${pi_pattern(fen, pattern)}`
    })
    postMessage({ id, result })
  }
}

