# georender-clip

polygon clipping tool for [georender][] data

[georender]: https://github.com/peermaps/docs/blob/master/georender.md

# usage

```
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

```

# example

``` js
var georenderClip = require('georender-clip')
var A = Buffer.from('0364d0860303cdcccc3d0000003f9a99993f0000003f0000003f0000c03f0100010200', 'hex')
var B = [[0,0],[0,1],[1,0]]
var opts = Object.assign({ mode: 'divide' }, require('pclip/xy'))
console.log(georenderClip(A, B, opts))
```

# api

``` js
var georenderClip = require('georender-clip')
```

## var buf = georenderClip(A, B, opts)

Clip subject geometry `A` with clip geometry `B` using algorithm `opts.mode`.

One of `A` and `B` must be a georender Buffer and the other must be geojson coordinates array data
as supported by [pclip][].

All `opts` are passed to [pclip][]. Consult [pclip][] documentation for more information.

[pclip]: https://github.com/substack/pclip

