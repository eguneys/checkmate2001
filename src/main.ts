import './style.css'
import './theme.css'
import Checkmate2002 from './mate2.ts'

function app(el: HTMLElement) {

  let cc = Checkmate2002.init()
  el.appendChild(cc.el)

  cc.on_mounted()

  cc.load_puzzles()

}


app(document.getElementById('app')!)