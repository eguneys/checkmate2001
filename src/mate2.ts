import { INITIAL_FEN, Shess } from 'shess'
import { debounce } from './util.ts'

import { play_tuples, pattern as pi_pattern } from 'pichess24'

type Pz = {
  i: number,
  id: string,
  fen: string,
  blunder: string,
  moves: string[],
  tags: string

}

// TODO
const pz_last_fen = (pz: Pz) => play_tuples(pz.fen, pz.blunder + ' ' + pz.moves.join(' '))
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

  selected_pz?: PatternPz

  selected_pz_updates: (() => void) [] = []
  fpz_updates: (() => void) [] = []
  f_updates: (() => void)[] = []

  pull_list(cb: (_: PatternPz[]) => void) {
    let cb2 = () => {
      cb(this.filtered_pzs)
    }
    cb2()
    this.fpz_updates.push(cb2)

  }

  pull_nb = (cb: (_: string) => void) => {
    let cb2 = () => {
      cb(`${this.filtered_pzs.length}/${this.pattern_pzs.length}`)
    }
    cb2()
    this.fpz_updates.push(cb2)
  }


  pull_filter(cb: (_: string) => void) {
    let cb2 = () => {
      cb(this.filter)
    }
    cb2()
    this.f_updates.push(cb2)
  }

  pull_select_pz(cb: (pz: PatternPz) => void) {
    let cb2 = () => {
      if (this.selected_pz) {
        cb(this.selected_pz)
      }
    }
    cb2()
    this.selected_pz_updates.push(cb2)
  }

  push_filter(_: string) {
    this.filter = _
    this.run_fpz_updates()
  }

  push_selected_pz(_: PatternPz) {
    this.selected_pz = _
    this.selected_pz_updates.forEach(_ => _())
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


  pull_pz_filter = (cb: (_: string) => void) => {
    let cb2 = () => {
      if (this.pz) {
        this.pz.pull_filter(cb)
      } else {
        cb('')
      }
    }
    cb2()
    this.pz_updates.push(cb2)
  }

  push_selected_pz = (_: PatternPz) => {
    if (this.pz) {
      this.pz.push_selected_pz(_)
    }
  }

  push_pz_filter = (_: string) => {
    if (this.pz) {
      this.pz.push_filter(_)
    }
  }

  pull_pz_list = (cb: (_: PatternPz[]) => void) => {
    let cb2 = () => {
      if (this.pz) {
        this.pz.pull_list(cb)
      } else {
        cb([])
      }
    }
    cb2()
    this.pz_updates.push(cb2)
  }

  pull_select_pz(cb: (pz: PatternPz) => void) {
    let cb2 = () => {
      if (this.pz) {
        this.pz.pull_select_pz(cb)
      } else {
        //cb([])
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

    let t_init = TButton.init('Init', on_init)
    let t_fboard = TButton.init('Flp Board', on_fboard)
    let t_fcolors = TButton.init('Flp Colors', on_fcolors)

    let b_wrap = document.createElement('div')
    b_wrap.classList.add('b-wrap')
    el.appendChild(b_wrap)

    b_wrap.appendChild(t_init.el)
    b_wrap.appendChild(t_fboard.el)
    b_wrap.appendChild(t_fcolors.el)

    let ss = Shess.init()
    el.appendChild(ss.el)

    State.pull_select_pz(pz => {
      ss.fen(pz.last_fen)
    })

    function on_init() {
      ss.fen(INITIAL_FEN)
    }

    function on_fboard() {
      ss.flip()
    }

    function on_fcolors() {

    }

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

type PullT<T> = ((on_pull: (_: T) => void) => void);


class THref {
  static init = (txt: string | PullT<string>, href: string, blank = false) => {

    let el: HTMLAnchorElement = document.createElement('a')
    el.href = href
    if (blank) {
      el.target = '_blank'
    }

    if (typeof txt === 'string') {
      el.text = txt
    } else {
      txt(on_update)
    }

    function on_update(txt: string) {
      el.text = txt
    }

    return new THref(el)
  }

  constructor(readonly el: HTMLAnchorElement) {}
}


class TButton {
  static init = (txt: string | PullT<string>, on_click: () => void) => {

    let el = document.createElement('button')

    if (typeof txt === 'string') {
      el.textContent = txt
    } else {
      txt(on_update)
    }

    function on_update(txt: string) {
      el.textContent = txt
    }


    el.addEventListener('click', () => {
      on_click()
    })

    return new TButton(el)
  }

  constructor(readonly el: HTMLButtonElement) {}
}



class TText {
  static init = (txt: string | PullT<string>) => {

    let el = document.createTextNode('')

    if (typeof txt === 'string') {
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

class TTInput {

  static init = (placeholder: string, txt: PullT<string>, push: (_: string) => void) => {
    let el = document.createElement('input')

    el.placeholder = placeholder

    txt(on_update)

    function on_update(txt: string) {
      el.textContent = txt
    }

    el.addEventListener('input', debounce((_) => {
      push(el.value)
    }, 200))

    return new TTInput(el)
  }

  constructor(readonly el: HTMLInputElement) {}
}


class TVirtualList {

  static init = <T, V extends HTMLElement>(txt: PullT<T[]>, view: (_: T) => V): TVirtualList => {

    let el_wrap = document.createElement('div')
    el_wrap.classList.add('v-wrap')

    let els = document.createElement('ul')
    el_wrap.appendChild(els)

    el_wrap.addEventListener('scroll', debounce(on_scroll, 200))

    let ttt: T[] = []

    let vvv: V[] = []

    let nb_chunk = 30
    let i_loaded_chunk: undefined | number = undefined

    function on_scroll() {

      let scroll_top = el_wrap.scrollTop
      //let client_height = els.clientHeight


      let i_load_chunk = i_loaded_chunk ?? 0

      if (i_loaded_chunk !== undefined) {
        if (Math.abs(scroll_top) > 10) {
          i_load_chunk = i_loaded_chunk + Math.floor(scroll_top / 10)
          el_wrap.scrollTop = 0
          scroll_top = 0
        }
      }

      if (i_loaded_chunk !== i_load_chunk) {
        if (i_loaded_chunk !== undefined) {

          if (i_load_chunk < i_loaded_chunk) {
          for (let i = i_load_chunk + nb_chunk; i < i_loaded_chunk + nb_chunk; i++) {
            if (i >= vvv.length) {
              break
            }
            vvv[i].remove()
          }
          } else if (i_load_chunk > i_loaded_chunk) {
          for (let i = i_loaded_chunk; i < i_load_chunk; i++) {
            if (i >= vvv.length) {
              break
            }
            vvv[i].remove()
          }
          }

        }

        if (!i_loaded_chunk) {
        for (let i = i_load_chunk; i < i_load_chunk + nb_chunk; i++) {
          if (i >= ttt.length) {
            break;
          }
          vvv[i] = view(ttt[i])
        }
        els.append(...vvv.slice(i_load_chunk, i_load_chunk + nb_chunk))
        } else if (i_load_chunk > i_loaded_chunk) {
        for (let i = i_loaded_chunk + nb_chunk; i < i_load_chunk + nb_chunk; i++) {
          if (i >= ttt.length) {
            break;
          }
          vvv[i] = view(ttt[i])
        }
        els.append(...vvv.slice(i_loaded_chunk + nb_chunk, i_load_chunk + nb_chunk))
        } else if (i_load_chunk < i_loaded_chunk) {
        for (let i = i_loaded_chunk; i > i_load_chunk + nb_chunk; i--) {
          if (i >= ttt.length) {
            break;
          }
          vvv[i] = view(ttt[i])
        }
        els.prepend(...vvv.slice(i_loaded_chunk, i_load_chunk + nb_chunk))
        }
      }
      i_loaded_chunk = i_load_chunk
    }

    txt(on_update)

    function on_update(txt: T[]) {
      ttt = txt
      on_scroll()
    }

    return new TVirtualList(el_wrap, els)
  }

  constructor(readonly el: HTMLElement, readonly ul: HTMLUListElement) {}
}

class TPizzaListItem {

  static init = (pz: PatternPz) => {
    let li = document.createElement('li')
    li.classList.add('pz')

    State.pull_select_pz(spz => {
      if (pz == spz) {
        li.classList.add('selected')
      } else {
        li.classList.remove('selected')
      }
    })

    let t_id = THref.init(`${pz.pz.id}`, `https://lichess.org/training/${pz.pz.id}`, true)
    li.appendChild(t_id.el)


    let t_builtin = TText.init(pz.builtin_tags.join(' '))
    let t_tags = TText.init(pz.tags.join(' '))

    let ss = document.createElement('span')
    ss.appendChild(t_tags.el)
    li.appendChild(ss)

    let ss2 = document.createElement('span')
    ss2.appendChild(t_builtin.el)
    li.appendChild(ss2)

    li.addEventListener('click',  () => {
      State.push_selected_pz(pz)
    })

    return new TPizzaListItem(li)
  }

  constructor(readonly el: HTMLElement) {}
}


class TPageList {

  static init = <T, V extends HTMLElement>(txt: PullT<T[]>, view: (_: T) => V): TVirtualList => {
    let el_wrap = document.createElement('div')
    el_wrap.classList.add('v-wrap')

    let els = document.createElement('ul')
    el_wrap.appendChild(els)

    let ttt: T[] = []
    //let vvv: V[] = []

    txt(on_update)

    function on_update(txt: T[]) {
      ttt = txt
      els.innerHTML = ''
      els.append(...ttt.map(_ => view(_)))
    }

    return new TPageList(el_wrap, els)


  }

  constructor(readonly el: HTMLElement, readonly ul: HTMLUListElement) {}
}


class Section4 {

  static init = () => {
    let el = document.createElement('section4')

    let filter = TTInput.init('Filter y_filter _!_ n_filter', State.pull_pz_filter, State.push_pz_filter)
    el.appendChild(filter.el)

    let nb_pizzas = TText.init(State.pull_pz_nb)
    let positions = TText.init('Positions')

    let sp_pizzas = document.createElement('span')
    sp_pizzas.appendChild(nb_pizzas.el)
    el.appendChild(sp_pizzas)

    let sp_positions = document.createElement('span')
    sp_positions.appendChild(positions.el)
    el.appendChild(sp_positions)


    let tv = TPageList.init<PatternPz, HTMLElement>(State.pull_pz_list, pz => {
      let i = TPizzaListItem.init(pz)
      return i.el
    })

    el.appendChild(tv.el)

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