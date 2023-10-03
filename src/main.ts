import './style.css'
import './theme.css'

import { hello } from 'pichess24'
import { INITIAL_FEN, Shess } from 'shess'

type Pz = {
  id: string,
  fen: string,
  blunder: string,
  moves: string[],
  tags: string

}

const parse_tenk = (tenk: string) => {
  return tenk.trim().split('\n').map(line => {
    let xx = line.split(',')
    let [id, fen, mmoves, _x, _y, _z, _w, tags] = xx

    let blunder = mmoves.split(' ').slice(0, 1)[0]
    let moves = mmoves.split(' ').slice(1)

    return {
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


class TTextInput {
  static init = (txt: string) => {

    let bte = document.createElement('input')

    const on_update = (txt: string) => {
      bte.value = txt
    }


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



class TSpan {
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
  static init = (pz: Pz) => {

    let el = document.createElement('li')
    el.classList.add('pz')

    let sp_id = TA.init(pz.id, `https://lichess.org/training/${pz.id}`)

    el.appendChild(sp_id.el)

    let ul_tags = document.createElement('ul')
    el.appendChild(ul_tags)

    let tags = pz.tags.split(' ')
    tags.forEach(tag => {
      let li = document.createElement('li')
      li.textContent = tag
      ul_tags.appendChild(li)
    })



    PossList.push({
      el
    })

  }
}

type PossCb = {
  el: HTMLLIElement
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

    els_wrap.addEventListener('scroll', throttle(res.on_scroll, 800))

    return res
  }

  ps: PossCb[] = []


  private _visible: PossCb[] = []

  private _scroll_top = 0
  private _i_top = 0

  on_scroll = () => {
    let scroll_top = this.el.scrollTop
    let _visible_height = this.el.clientHeight

    let d_scroll = scroll_top - this._scroll_top

    this._scroll_top = scroll_top

    if (d_scroll < 0) {
      // console.log('up', d_scroll)
    } else if (d_scroll > 0) {
      // console.log('down', d_scroll)
    }


  }

  push(cb: PossCb) {
    this.ps.push(cb)
    this.ul.appendChild(cb.el)
  }

  constructor(readonly el: HTMLElement, readonly ul: HTMLUListElement) {}
}

class Template {

  static init = () => {
     
    let el = document.createElement('checkmate2001')

    let sect2 = document.createElement('section')
    let sect3 = document.createElement('section')
    let sect4 = document.createElement('section')

    sect2.classList.add('two')
    sect3.classList.add('three')
    sect4.classList.add('four')

    el.appendChild(sect3)
    el.appendChild(sect4)
    el.appendChild(sect2)



    let { cbs } = CButtons
    sect2.appendChild(cbs)

    let ss = Shess.init()
    sect2.appendChild(ss.el)
  
    ss.fen(INITIAL_FEN)

    
    TButton.init('init', () => { ss.fen(INITIAL_FEN) })
    TButton.init('flp brd', () => { ss.flip() })
    TButton.init('flp color', () => {})



    let sp_label = TTextInput.init('Filter Position yes_filter _!_ no_filter')
    sect4.appendChild(sp_label.el)

    let nb_poss_label = TLabel.init('8/10000')
    sect4.appendChild(nb_poss_label.el)
    let poss_label = TLabel.init('Positions')
    sect4.appendChild(poss_label.el)

    sect4.appendChild(PossList.el)


    return new Template(el)

  }

  constructor(readonly el: HTMLElement) {}
}


class Checkmate2001 {
  static init = () => {
    let tt = Template.init()



    load_tenk()
    .then(kk => {
      kk.slice(0, 200).forEach(k => PossListItem.init(k))
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


function throttle(func: (...args: any[]) => void, delay: number) {
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

  console.log(hello())

  let cc = Checkmate2001.init()

  el.appendChild(cc.el)

}


app(document.getElementById('app')!)