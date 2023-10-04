type Pz = {
  i: number,
  id: string,
  fen: string,
  blunder: string,
  moves: string[],
  tags: string

}

// TODO
const pz_last_fen = (pz: Pz) => pz.fen
const match_mate_pattern = (fen: string, patt: string) => fen === patt

const parse_tenk = (tenk: string) => {
  let i = 0;
  return tenk.trim().split('\n').map(line => {
    let xx = line.split(',')
    let [id, fen, mmoves, _x, _y, _z, _w, tags] = xx

    let blunder = mmoves.split(' ').slice(0, 1)[0]
    let moves = mmoves.split(' ').slice(1)

    i++;
    return {
      i,
      id,
      fen,
      blunder,
      moves,
      tags
    }
  })
}

const load_tenk = async () => {
  const csv_url = new URL('./tenk_puzzle.csv', import.meta.url).href

  let res = await fetch(csv_url).then(res => res.text())

  return parse_tenk(res)
}

type PatternPz = {
  pz: Pz,
  last_fen: string,
  tags: string[],
  builtin_tags: string[]
}

class PzManager {

  static init = (pz: Pz[]) => {

    let ppz = pz.map(pz => ({ pz, last_fen: pz_last_fen(pz), tags: [], builtin_tags: pz.tags.split(' ') }))
    return new PzManager(ppz)
  }

  constructor(readonly pattern_pzs: PatternPz[]) {
    this.run_fpz_updates()
  }


  apply_pattern(name: string, pattern: string) {
    this.pattern_pzs.forEach(ppz => {
      if (match_mate_pattern(ppz.last_fen, pattern)) {
        ppz.tags = ppz.tags.filter(_ => _ !== name)
        ppz.tags.push(name)
      }
    })
    this.run_fpz_updates()
  }

  run_fpz_updates() {
    let [y_filter, n_filter] = this.filter.split('_!_')
    y_filter ||= ''
    n_filter ||= ''
    let y = y_filter.trim().split(' ').filter(_ => _ !== '')
    let n = n_filter.trim().split(' ').filter(_ => _ !== '')

    this.filtered_pzs = this.pattern_pzs.filter(ppz => {
      let tags = [...ppz.builtin_tags, ...ppz.tags]
      return y.every(y => tags.includes(y)) &&
      n.every(n => !tags.includes(n))
    })
    this.fpz_updates.forEach(_ => _())
  }

  filter: string = ''
  filtered_pzs: PatternPz[] = []

  fpz_updates: (() => void) [] = []

  pull_nb = (cb: (_: string) => void) => {
    let cb2 = () => {
      cb(`${this.filtered_pzs.length}/${this.pattern_pzs.length}`)
    }
    cb2()
    this.fpz_updates.push(cb2)
  }

}

class _StateManager {

  pz?: PzManager

  pz_updates: (() => void)[] = []

  async load() {
    this.pz = PzManager.init(await load_tenk())
    this.pz_updates.forEach(_ => _())
  }


  pull_pz_nb = (cb: (_: string) => void) => {
    let cb2 = () => {
      if (this.pz) {
        this.pz.pull_nb(cb)
      } else {
        cb('...')
      }
    }
    cb2()
    this.pz_updates.push(cb2)
  }

}


const State = new _StateManager()

class Section2 {

  static init = () => {

    let el = document.createElement('section2')

    return new Section2(el)

  }

  constructor(readonly el: HTMLElement) {}
}

class Section3 {

  static init = () => {

    let el = document.createElement('section3')
    return new Section3(el)
  }

  constructor(readonly el: HTMLElement) {}
}

type PullT<T> = T | ((on_pull: (_: T) => void) => void);

class TText {
  static init = (txt: PullT<string>) => {

    let el = document.createTextNode('')

    if (typeof txt == 'string') {
      el.textContent = txt
    } else {
      txt(on_update)
    }

    function on_update(txt: string) {
      el.textContent = txt
    }

    return new TText(el)
  }

  constructor(readonly el: Text) {}
}

class Section4 {

  static init = () => {
    let el = document.createElement('section4')


    let nb_pizzas = TText.init(State.pull_pz_nb)
    let positions = TText.init('Positions')

    let sp_pizzas = document.createElement('span')
    sp_pizzas.appendChild(nb_pizzas.el)
    el.appendChild(sp_pizzas)

    let sp_positions = document.createElement('span')
    sp_positions.appendChild(positions.el)
    el.appendChild(sp_positions)


    return new Section4(el)
  }

  constructor(readonly el: HTMLElement) {}
}

export default class Checkmate2002 {

  static init = () => {

    let el = document.createElement('checkmate2001')

    let sect2 = Section2.init()
    let sect3 = Section3.init()
    let sect4 = Section4.init()

    let ss3 = document.createElement('section')
    ss3.appendChild(sect3.el)
    el.appendChild(ss3)

    let ss4 = document.createElement('section')
    ss4.appendChild(sect4.el)
    el.appendChild(ss4)

    let ss2 = document.createElement('section')
    ss2.appendChild(sect2.el)
    el.appendChild(ss2)



    ss2.classList.add('two')
    ss3.classList.add('three')
    ss4.classList.add('four')

    return new Checkmate2002(el)
  }

  constructor(readonly el: HTMLElement) {}


  load_puzzles() {
    State.load()
  }
}