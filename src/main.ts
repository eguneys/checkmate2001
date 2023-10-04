import './style.css'
import './theme.css'

import { play_tuples } from 'pichess24'
import { INITIAL_FEN, Shess } from 'shess'

type Pz = {
  i: number,
  id: string,
  fen: string,
  blunder: string,
  moves: string[],
  tags: string

}

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

class TTextArea {
  static init = (txt: string, on_input: (_: string) => void) => {

    let bte = document.createElement('textarea')

    bte.rows = 3
    bte.cols = 6
    bte.maxLength = 3 * 6

    const on_update = (txt: string) => {
      bte.value = txt
    }

    bte.addEventListener('input', debounce(ev => {
      on_input((ev.target as HTMLInputElement).value)
    }, 100))

    bte.placeholder = txt;
    return new TTextArea(bte, on_update)
  }

  constructor(readonly el: HTMLTextAreaElement, readonly on_update: (_: string) => void) {}
}



class TTextInput {
  static init = (txt: string, on_input: (_: string) => void) => {

    let bte = document.createElement('input')

    const on_update = (txt: string) => {
      bte.value = txt
    }

    bte.addEventListener('input', debounce(ev => {
      on_input((ev.target as HTMLInputElement).value)
    }, 100))

    bte.placeholder = txt;
    return new TTextInput(bte, on_update)
  }

  constructor(readonly el: HTMLInputElement, readonly on_update: (_: string) => void) {}
}


class TA {
  static init = (txt: string, link: string) => {

    let bte: HTMLAnchorElement = document.createElement('a')
    bte.text = txt
    bte.href = link
    bte.target = '_blank'

    return new TA(bte)
  }

  constructor(readonly el: HTMLAnchorElement) {}
}



export class TSpan {
  static init = (txt: string) => {

    let bte = document.createElement('span')

    const on_update = (txt: string) => {
      bte.textContent = txt
    }


    on_update(txt)
    return new TSpan(bte, on_update)
  }

  constructor(readonly el: HTMLElement, 
    readonly on_update: (_: string) => void) {}
}



class TLabel {
  static init = (txt: string) => {

    let bte = document.createElement('label')

    const on_update = (txt: string) => {
      bte.textContent = txt
    }


    on_update(txt)
    return new TLabel(bte, on_update)
  }

  constructor(readonly el: HTMLLabelElement, 
    readonly on_update: (_: string) => void) {}
}


class TButton {
  static init = (txt: string, on_click: () => void) => {

    let bte = document.createElement('button')

    bte.textContent = txt

    bte.addEventListener('click', () => {
      on_click()
    })

    return new TButton(bte)

  }

  constructor(readonly el: HTMLButtonElement) {}
}




class CButton {
  static init = (txt: string, on_click: () => void) => {

    let bte = document.createElement('button')

    bte.textContent = txt

    bte.addEventListener('click', () => {
      on_click()
    })

    let bcb: ButtonCb;
    
    const _on_init = () => {
      CButtons.push(bcb)
    }

    bcb = {
      el: bte,
    }

    _on_init()
  }
}

class PossListItem {
  static init = (pz: Pz, on_selected: () => void) => {

    let el = document.createElement('li')
    el.classList.add('pz')

    let sp_id = TA.init(`${pz.i}`, `https://lichess.org/training/${pz.id}`)

    el.appendChild(sp_id.el)

    let tags_wrap = document.createElement('div')
    let ul_tags = document.createElement('ul')
    el.appendChild(tags_wrap)
    tags_wrap.appendChild(ul_tags)

    let tags = pz.tags.split(' ')
    tags.forEach(tag => {
      let li = document.createElement('li')
      li.textContent = tag
      ul_tags.appendChild(li)
    })

    const _on_selected = (v: boolean) => {
      if (v) {
        el.classList.add('selected')
      } else {
        el.classList.remove('selected')
      }
    }


    let b_select = TButton.init('select', on_selected)

    el.appendChild(b_select.el)

    return new PossListItem(el, pz, _on_selected)
  }

  constructor(readonly el: HTMLLIElement, readonly pz: Pz, readonly on_selected: (v: boolean) => void) {}
}

class PossListManager {


  static init = () => {
    let els_wrap = document.createElement('div')
    els_wrap.classList.add('poss-wrap')

    let els = document.createElement('ul')
    els_wrap.appendChild(els)

    let loading_el = document.createTextNode('loading...')
    els.appendChild(loading_el)


    let res = new PossListManager(els_wrap, els)

    els_wrap.addEventListener('scroll', debounce(res.on_scroll, 200))

    return res
  }

  _ps: Pz[] = []

  get ps() {
    return this._ps
    .filter(x => this.y_filter.every(y => x.tags.split(' ').includes(y)))
    .filter(x => this.n_filter.every(n => !x.tags.split(' ').includes(n)))
  }

  private _filter: string = ''

  set filter(_: string) {
    this._filter = _

    this.on_scroll()

  }


  get y_filter() {
    let [y_filter] = this._filter.split('_!_')

    if (!y_filter) {
      return []
    }

    return y_filter.trim().split(' ')
    .filter(x => x !== '')
    .map(x => x.trim())
  }
  get n_filter() {
    let [_, n_filter] = this._filter.split('_!_')

    if (!n_filter) {
      return []
    }

    return n_filter.trim().split(' ')
    .filter(x => x !== '')
    .map(x => x.trim())
  }

  private _visible: Map<number, PossListItem> = new Map()

  private _selected_index: number = 0

  on_scroll = () => {
    const find_index = (n: number) => Math.floor(n / 100)
    let scroll_top = this.el.scrollTop

    //10000 500
    // 1000 100
    // 250  30
    let n = Math.floor(this.ps.length / 30)

    let i_begin = Math.max(0, find_index(scroll_top) - n)
    let i_end = Math.min(this.ps.length, i_begin + n * 3)

    this.ul.style.transform = `translateY(${i_begin * 100}px)`

    this.ul.innerHTML = ''
    this._visible.clear()

    for (let i = i_begin; i < i_end; i++) {
      let pi = PossListItem.init(this.ps[i], () => {
        this._selected_index = i

        this.on_selected?.(pi.pz)

      ;[...this._visible.entries()]
      .forEach(([i, v]) => v.on_selected(i === this._selected_index))
      })

      ;[...this._visible.entries()]
      .forEach(([i, v]) => v.on_selected(i === this._selected_index))

      this.ul.appendChild(pi.el)
      this._visible.set(i, pi)
    }

  }

  on_selected?: (pz: Pz) => void

  push(pz: Pz) {
    this._ps.push(pz)
  }

  init() {
    this.on_scroll()
  }

  constructor(readonly el: HTMLElement, readonly ul: HTMLUListElement) {}
}


class Section3 {
  static init = () => {

    let el = document.createElement('section3')

    let e_select = TLabel.init('Select Pattern')
    el.appendChild(e_select.el)

    let e_name = TTextInput.init('Pttrn Name', (name: string) => {

    })

    el.appendChild(e_name.el)

    let e_pttrn = TTextArea.init('PcRaRr\nRaRrRr\nOoOoOo', (pttrn: string) => {
      console.log(pttrn)
    })

    el.appendChild(e_pttrn.el)

    let e_apply = TButton.init('Apply Pattern', () => {

    })
    el.appendChild(e_apply.el)

    return new Section3(el)
  }


  constructor(readonly el: HTMLElement) {}
}

class Template {

  static init = () => {
     
    let el = document.createElement('checkmate2001')

    let e_sect2 = document.createElement('section')
    let e_sect3 = document.createElement('section')
    let e_sect4 = document.createElement('section')

    e_sect2.classList.add('two')
    e_sect3.classList.add('three')
    e_sect4.classList.add('four')

    el.appendChild(e_sect3)
    el.appendChild(e_sect4)
    el.appendChild(e_sect2)

    let sect3 = Section3.init()
    e_sect3.appendChild(sect3.el)


    let { cbs } = CButtons
    e_sect2.appendChild(cbs)

    let ss = Shess.init()
    e_sect2.appendChild(ss.el)
  
    ss.fen(INITIAL_FEN)
    PossList.on_selected = pz => {
      let fen = play_tuples(pz.fen, pz.blunder + ' ' + pz.moves.join(' '))
      if (!fen) {

        throw "No fen on pz" + pz
      }
      ss.fen(fen)
    }

    
    CButton.init('init', () => { ss.fen(INITIAL_FEN) })
    CButton.init('flp brd', () => { ss.flip() })
    CButton.init('flp color', () => {})



    let nb_poss_label = TLabel.init('8/10000')

    let sp_label = TTextInput.init('Filter Position yes_filter _!_ no_filter', value => {
      PossList.filter = value
      nb_poss_label.on_update(`${PossList.ps.length}/${PossList._ps.length}`)
    })
    e_sect4.appendChild(sp_label.el)
    e_sect4.appendChild(nb_poss_label.el)

    let poss_label = TLabel.init('Positions')
    e_sect4.appendChild(poss_label.el)

    e_sect4.appendChild(PossList.el)

    const on_init = () => {
      nb_poss_label.on_update(`${PossList.ps.length}/${PossList._ps.length}`)
    }

    return new Template(el, on_init)

  }

  constructor(readonly el: HTMLElement, readonly on_init: () => void) {}
}


class Checkmate2001 {
  static init = () => {
    let tt = Template.init()



    load_tenk()
    .then(kk => {
      kk.forEach(k => PossList.push(k))
      PossList.init()
      tt.on_init()
    })


    return new Checkmate2001(tt.el)
  }

  constructor(readonly el: HTMLElement) {}
}

type ButtonCb = {
  el: HTMLButtonElement
}

class CButtonsManager {

  bs: ButtonCb[] = []

  cbs: HTMLElement

  constructor() {
    this.cbs = document.createElement('cbs')
   }

   push(p: ButtonCb) {
    this.bs.push(p)
    this.cbs.append(p.el)
   }

}


const CButtons = new CButtonsManager()
const PossList = PossListManager.init()

function debounce(func: (...args: any[]) => void, wait: number) {
  let t_id: number;
  return (...args: any[]) => {
    window.clearTimeout(t_id)
    t_id = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle(func: (...args: any[]) => void, delay: number) {
  let lastCallTime = 0;
  
  return function (...args: any[]) {
    const now = new Date().getTime();
    
    if (now - lastCallTime >= delay) {
      func(...args);
      lastCallTime = now;
    }
  };
}


function app(el: HTMLElement) {

  console.log(el)

  //console.log(play_tuples(INITIAL_FEN, "e2e4 d7d5"))

  let cc = Checkmate2001.init()

  el.appendChild(cc.el)

}


app(document.getElementById('app')!)