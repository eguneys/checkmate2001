type XYXY2 = [number, number, number, number]
type XY = [number, number]

const files = 'abcdefgh'.split('')
const ranks = '12345678'.split('')
export const ofy = ([fi, ri]: XY) => `${files[fi]}${ranks[ri]}`
export const odify = ([x, y, x2, y2]: XYXY2) => [ofy([x, y]), ofy([x2, y2])]

const hl = [8,7,6,5,4,3,2,1]
const lh = [1,2,3,4,5,6,7,8]

export const patternify = (fen: string, arrows: string[], circles: string[]) => {
  let res = []

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

  let bk
  for (let [pos, ch] of pieces) {
    if (ch === 'k') {
      bk = pos
    }
  }

  if (!bk) {
    return undefined
  }

  arrows.flatMap(od => {
    let o = od.slice(0, 2)
    let d = od.slice(2, 4)

    if (pieces.has(o)) {

    }

  })

}