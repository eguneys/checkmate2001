import Worker from './piworker.ts?worker'

export type NbTotal = { nb: number, total: number }

export type FenMoves = { fen: string, moves: string }
export type FenPattern = { fen: string, pattern: string }

type WorkerCb = { id: string, result: string[] }

let i = 1
const gen_id = () => `wm_${i++}`

class _Pi {

  w: Worker = new Worker()

  cbs: { id: string, cb: (_: string[]) => void } [] = []

  constructor() {

    this.w.addEventListener('message', (ev: MessageEvent<WorkerCb>) => {
      let cb = this.cbs.find(_ => _.id === ev.data.id)
      if (cb) {
        cb.cb(ev.data.result)
      }
      this.cbs = this.cbs.filter(_ => _.id !== ev.data.id)
      this.nb_queue_updates.forEach(_ => _())
    })

  }

  private nb_queue_updates: (() => void)[] = []

  pull_nb_queue = (cb: (_: NbTotal) => void) => {
    let total = 0
    let p_cbs = 0

    this.nb_queue_updates.push(() => {
      if (p_cbs < this.cbs.length) {
        total = this.cbs.length
      }
      p_cbs = this.cbs.length
      cb({ nb: this.cbs.length, total})
    })
  }

  private one_pull_fen_moves_or_patterns(cb: (_: string[]) => void, fen_moves?: FenMoves[], fen_patterns?: FenPattern[]) {
    let id = gen_id()

    this.cbs.push({ id, cb })
    this.w.postMessage({
      id,
      fen_moves,
      fen_patterns
    })

    this.nb_queue_updates.forEach(_ => _())
  }

  async batch_pz_last_fen(fen_moves: FenMoves[]): Promise<string[]> {
    return new Promise(resolve => 
      this.one_pull_fen_moves_or_patterns((last_fens: string[]) => {
        resolve(last_fens)
      }, fen_moves)
    )
  }


  async batch_match_mate_pattern(fen_pattern: FenPattern[]): Promise<boolean[]> {
    return new Promise(resolve => 
      this.one_pull_fen_moves_or_patterns((matched: string[]) => {
        resolve(matched.map(_ => _ === 'true'))
      }, undefined, fen_pattern)
    )
  }


}


export default new _Pi()
