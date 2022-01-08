var georenderClip = require('../')
var A = Buffer.from('0364d0860303cdcccc3d0000003f9a99993f0000003f0000003f0000c03f0100010200', 'hex')
var B = [[0,0],[0,1],[1,0]]
var opts = Object.assign({ mode: 'divide' }, require('pclip/xy'))
console.log(georenderClip(A, B, opts))
