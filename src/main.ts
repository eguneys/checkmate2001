import './style.css'
import './theme.css'

import { hello } from 'pichess24'
import { INITIAL_FEN, Shess } from 'shess'


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


class PossList {
  static init = () => {
    let els = document.createElement('ul')



    return new PossList(els)
  }

  constructor(readonly el: HTMLUListElement) {}
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



    let sp_label = TLabel.init('Search Position')
    sect4.appendChild(sp_label.el)

    let nb_poss_label = TLabel.init('8/10000')
    sect4.appendChild(nb_poss_label.el)
    let poss_label = TLabel.init('Positions')
    sect4.appendChild(poss_label.el)

    let pls = PossList.init()
    sect4.appendChild(pls.el)


    return new Template(el)

  }

  constructor(readonly el: HTMLElement) {}
}


class Checkmate2001 {
  static init = () => {
    let tt = Template.init()

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




function app(el: HTMLElement) {

  console.log(el)

  console.log(hello())

  let cc = Checkmate2001.init()

  el.appendChild(cc.el)

}


app(document.getElementById('app')!)