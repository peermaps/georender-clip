#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var through = require('through2')
var split = require('split2')
var pump = require('pump')
var pumpify = require('pumpify')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: {
    f: 'format',
    'if': ['in-format','informat','inFormat'],
    of: ['out-format','outformat','outFormat'],
    i: 'infile',
    o: 'outfile',
    h: 'help',
  },
  default: { outfile: '-' },
})

if (argv.help) return usage()

var infile = argv.infile ?? argv._[0] ?? '-'
var instream = infile === '-'
  ? process.stdin
  : fs.createReadStream(infile)
var outstream = argv.outfile === '-'
  ? process.stdout
  : fs.createWriteStream(argv.outfile)

var ifstream = null
var ifmt = argv.inFormat ?? argv.format
if (ifmt === 'base64' || ifmt === 'hex') {
  ifstream = pumpify(split(), through(function (buf, enc, next) {
    next(null, Buffer.from(buf.toString(), ifmt))
  }))
} else {
  var lp = require('length-prefixed-stream')
  ifstream = lp.decode()
}

var ofstream = null
var ofmt = argv.outFormat ?? argv.format
if (ofmt === 'base64' || ofmt === 'hex') {
  ofstream = through(function (buf, enc, next) {
    next(null, buf.toString(ofmt) + '\n')
  })
} else {
  var lp = require('length-prefixed-stream')
  ofstream = lp.encode()
}

var opts = {}
if (argv.union !== undefined) {
  opts.mode = 'union'
} else if (argv.difference !== undefined) {
  opts.mode = 'difference'
} else if (argv.intersect !== undefined) {
  opts.mode = 'intersect'
} else if (argv.exclude !== undefined) {
  opts.mode = 'exclude'
} else if (argv.divide !== undefined) {
  opts.mode = 'divide'
} else if (argv.cut) {
  opts.mode = 'cut'
} else if (argv.show !== undefined) {
  opts.mode = 'show'
} else {
  return exit('no clipping method provided')
}
var clip = require('./')
var clipGeometry = getGeometry(argv[opts.mode])
if (argv.show !== undefined) return console.log(JSON.stringify(clipGeometry))
var clipStream = through.obj(function (buf, enc, next) {
  var buffers = clip(buf, clipGeometry, opts)
  for (var i = 0; i < buffers.length; i++) {
    this.push(buffers[i])
  }
  next()
})
pump(instream, ifstream, clipStream, ofstream, outstream)

function getGeometry(arg) {
  var geometry = null, m
  if (m = /^icosphere:(\d+)?$/.exec(arg)) {
    var xyzMesh = require('./lib/xyz-mesh-to-lonlat.js')
    var icosphere = require('icosphere')
    geometry = xyzMesh(icosphere(Number(m[1])))
  } else if (arg !== undefined) {
    var toCoords = require('./lib/to-coords.js')
    var src = fs.readFileSync(arg, 'utf8')
    geometry = JSON.parse(src)
    if (!Array.isArray(geometry)) {
      geometry = toCoords(geometry)
    }
  }
  return geometry
}

function exit(msg) {
  console.error(msg)
  process.exit(1)
}

function usage() {
  console.log(`
    usage: georender-clip [INFILE] {OPTIONS}

        -i --infile      Read georender data from INFILE.
        -f --format      Set input and output format.
      --if --in-format   Set input format: base64, hex, lp (default)
      --of --out-format  Set output format: base64, hex, lp (default)

      --divide GEOMETRY      Divide INFILE by GEOMETRY.
      --intersect GEOMETRY   Intersect GEOMETRY with INFILE.
      --union GEOMETRY       Union GEOMETRY with INFILE.
      --difference GEOMETRY  Subtract GEOMETRY from INFILE.
      --exclude GEOMETRY     Exclude GEOMETRY from INFILE.
      --show GEOMETRY        Print GEOMETRY instead of clipping.

    GEOMETRY can be a json file of geojson or geojson coordinate arrays or
    a grid type (below. disambiguate files from grid types with leading ./ or /

      icosphere:N  build an icosphere of subdivision number N

    Use --geometry GEOMETRY to print GEOMETRY and perform no clipping.

  `.trim().replace(/^ {4}/mg,'') + '\n')
}
