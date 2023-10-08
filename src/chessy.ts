
const files = 'abcdefgh'.split('')
const ranks = '12345678'.split('')
export const ofy = ([fi, ri]: [number, number]) => `${files[fi]}${ranks[ri]}`
export const odify = ([x, y, x2, y2]: [number, number, number, number]) => [ofy([x, y]), ofy([x2, y2])]

