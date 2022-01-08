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
  boolean: ['xy','geo'],
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

var opts = null
if (argv.xy) {
  opts = Object.assign({}, require('pclip/xy'))
} else { // geo, default
  opts = Object.assign({}, require('pclip/geo'))
}

if (argv.union) {
  opts.mode = 'union'
} else if (argv.difference) {
  opts.mode = 'difference'
} else if (argv.intersect) {
  opts.mode = 'intersect'
} else if (argv.exclude) {
  opts.mode = 'exclude'
} else if (argv.divide) {
  opts.mode = 'divide'
} else {
  return exit('no clipping method provided')
}
var clip = require('./')
var clipGeometry = getGeometry(argv[opts.mode])
var clipStream = through(function (buf, enc, next) {
  next(null, clip(buf, clipGeometry, opts))
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
    clipGeometry = JSON.parse(src)
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

      --xy   Use cartesian coordinates.
      --geo  Use geodetic great circles in spherical coordinates. (default)

      --divide GEOMETRY      Divide INFILE by GEOMETRY.
      --intersect GEOMETRY   Intersect GEOMETRY with INFILE.
      --union GEOMETRY       Union GEOMETRY with INFILE.
      --difference GEOMETRY  Subtract GEOMETRY from INFILE.
      --exclude GEOMETRY     Exclude GEOMETRY from INFILE.

    GEOMETRY can be a json file of geojson or geojson coordinate arrays or
    a grid type (below. disambiguate files from grid types with leading ./ or /

      icosphere:N  build an icosphere of subdivision number N

  `.trim().replace(/^ {4}/mg,'') + '\n')
}
