import Worker from './piworker.ts?worker'

export type FenMoves = { fen: string, moves: string }
export type FenPattern = { fen: string, pattern: string }

type WorkerCb = { id: string, result: string }

let i = 1
const gen_id = () => `wm_${i++}`

class _Pi {

  w: Worker = new Worker()

  cbs: { id: string, cb: (_: string) => void } [] = []

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

  pull_nb_queue(cb: (_:number) => void) {
    this.nb_queue_updates.push(() => cb(this.cbs.length))
  }

  private one_pull_pz_play_tuples(cb: (_: string) => void, fen_moves: FenMoves | FenPattern) {
    let id = gen_id()

    this.cbs.push({ id, cb })
    this.w.postMessage({
      id,
      fen_moves,
    })

    this.nb_queue_updates.forEach(_ => _())
  }

  async pz_last_fen(fen: string, moves: string): Promise<string | undefined> {
    return new Promise(resolve => 
      this.one_pull_pz_play_tuples((last_fen: string | undefined) => {
        resolve(last_fen)
      }, { fen, moves })
    )
  }


  async match_mate_pattern(fen: string, pattern: string) {
    return new Promise(resolve => 
      this.one_pull_pz_play_tuples((last_fen: string) => {
        resolve(last_fen)
      }, { fen, pattern })
    )
  }


}


export default new _Pi()
