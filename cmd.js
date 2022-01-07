#!/usr/bin/env node

var fs = require('fs')
var through = require('through2')
var split = require('split2')
var pump = require('pump')
var pumpify = require('pumpify')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: {
    f: 'format',
    'if': ['in-format','inFormat'],
    of: ['out-format','outFormat'],
    i: 'infile',
    o: 'outfile',
  },
  default: { outfile: '-' },
})

var infile = argv.infile ?? argv._[0] ?? '-'
var instream = infile === '-'
  ? process.stdin
  : fs.createReadStream(infile)
var outstream = argv.outfile === '-'
  ? process.stdout
  : fs.createWriteStream(argv.outfile)

var ifstream = null
var ifmt = argv.inFormat || argv.format
if (ifmt === 'base64' || ifmt === 'hex') {
  ifstream = pumpify(split(), through(function (buf, enc, next) {
    next(null, Buffer.from(buf.toString(), ifmt))
  }))
} else {
  var lp = require('length-prefixed-stream')
  ifstream = lp.decode()
}

var ofstream = null
var ofmt = argv.outFormat || argv.format
if (ofmt === 'base64' || ofmt === 'hex') {
  ofstream = through(function (buf, enc, next) {
    next(null, buf.toString(ofmt) + '\n')
  })
} else {
  var lp = require('length-prefixed-stream')
  ofstream = lp.encode()
}

var clip = require('./')
var xyzMesh = require('./lib/xyz-mesh-to-lonlat.js')
var icosphere = require('icosphere')
var grid = xyzMesh(icosphere(0))
var clipStream = through(function (buf, enc, next) {
  next(null, clip.divide(buf, grid))
})
pump(instream, ifstream, clipStream, ofstream, outstream)
