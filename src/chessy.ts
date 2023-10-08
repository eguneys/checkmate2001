type XYXY2 = [number, number, number, number]
type XY = [number, number]

export const ofy = ([fi, ri]: XY) => `${files[fi]}${ranks[ri]}`
export const odify = ([x, y, x2, y2]: XYXY2) => [ofy([x, y]), ofy([x2, y2])]

const hl = [8,7,6,5,4,3,2,1]
const lh = [1,2,3,4,5,6,7,8]


const read_fen = (fen: string) => {
  let pieces = new Map<string, string>()
  fen = fen.split(' ')[0]

  fen.split('/').map((line: string, irank: number) => {
    let ifile = 0

    for (let ch of line) {

      if ('RNBKQPrbnqkp'.includes(ch)) {
        let pos = ofy([lh[ifile] - 1, hl[irank] - 1])

        pieces.set(pos, ch)
        ifile+= 1;
      } else if ('12345678'.includes(ch)) {
        ifile += parseInt(ch)
      }
    }
  })

  return pieces

}

const write_fen = (pieces: Map<string, string>): string => {
  let res: string[] = []
  hl.map(r => {
    let l = ''
    let s = 0
    lh.map((f) => {
      let o = ofy([f- 1, r -1 ])
      if (pieces.has(o)) {
        let c = pieces.get(o)

        let spaces = s === 0 ? '': `${s}`

        l += spaces + c
        s = 0
      } else {
        s++;
      }
    })
    res.push(l)
  })
  return res.join('/')
}

export const flip_colors = (fen: string) => {
  let [_, ...rest] = fen.split(' ')
  let pieces = read_fen(fen)


  let flipped = new Map<string, string>()


  for (let [pos, piece] of pieces) {
    if ("rnbkqp".includes(piece)) {
      piece = piece.toUpperCase()
    } else {
      piece = piece.toLowerCase()
    }
    flipped.set(pos, piece)
  }

  return write_fen(flipped) + ' ' + rest.join(' ')
}

export const patternify = (fen: string, arrows: string[], circles: string[]) => {

  let pieces = read_fen(fen)

  let bk
  for (let [pos, ch] of pieces) {
    if (ch === 'k') {
      bk = pos
    }
  }

  if (!bk) {
    return undefined
  }

  let bk_pad = go_kings_numpad(bk)

  let res = bk_pad.map(p => {
    if (!p) {
      return 'Oo'
    }

    for (let o of circles) {
      if (p === o) {
        if (pieces.has(o)) {
          let P = pieces.get(o)!
          return `${P}o`
        }
      }
    }

    for (let od of arrows) {
      let o = od.slice(0, 2)
      let d = od.slice(2, 4)

      let an = a_or_n(o, d)

      if (pieces.has(o)) {
        if (d === p) {
          let P = pieces.get(o)!
          if (P === 'p' || P === 'P') {
            return `${P}c`
          }
          if (P === 'n' || P === 'N') {
            return `${P}a`
          }

          return `${P}${an}`
        }
      }
    }

    return 'Xx'
  })

  return res.join('')
}

const files = 'abcdefgh'.split('')
const ranks = '12345678'.split('')
const irank: { [key: string]: number } = { 
  'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7, 
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 }

export const flip_pos = (pos: string) => {

  let f = irank[pos[0]]
  let r = 7 - irank[pos[1]]

  return files[f] + ranks[r]
}

export const a_or_n = (o: string, d: string) => {
  let res = go_kings_numpad(o)
  if (res.find(_ => _ === d)) {
    return 'a'
  } else {
    return 'n'
  }
}

export const go_kings_numpad = (pos: string) => {
  return [
    go_black_queen(pos), go_black(pos), go_black_king(pos),
    go_queen(pos), pos, go_king(pos),
    go_white_queen(pos), go_white(pos), go_white_king(pos),
  ]
}


export const go_black_king = (pos: string) => {
  let w = go_black(pos)
  if (w) { return go_king(w) }
}

export const go_black_queen = (pos: string) => {
  let w = go_black(pos)
  if (w) { return go_queen(w) }
}



export const go_white_queen = (pos: string) => {
  let w = go_white(pos)
  if (w) { return go_queen(w) }
}



export const go_white_king = (pos: string) => {
  let w = go_white(pos)
  if (w) { return go_king(w) }
}

export const go_white = (pos: string) => {
  let l = irank[pos[1]] - 1

  if (ranks[l]) {
    return pos[0] + ranks[l]
  }
}

export const go_black = (pos: string) => {
  let l = irank[pos[1]] + 1

  if (ranks[l]) {
    return pos[0] + ranks[l]
  }
}

export const go_queen = (pos: string) => {
  let l = irank[pos[0]] - 1

  if (files[l]) {
    return files[l] + pos[1]
  }
}

export const go_king = (pos: string) => {
  let l = irank[pos[0]] + 1

  if (files[l]) {
    return files[l] + pos[1]
  }
}
