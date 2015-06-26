Simplexify
==========

<img src='https://github.com/dylanmackenzie/simplexify/blob/master/gh-pages/animated-voronoi.gif' alt='Voronoi Diagram which follows mouse cursor' width=400 height=400 />

Simplexify implements the divide-and-conquer
algorithm [described by Yang, Choi and Jung](http://link.springer.com/article/10.1007%2Fs12541-011-0056-1)
for calculating a Delaunay triangulation (and Voronoi diagram) in Javascript. It
runs in O(n log n) time, and was written mainly to explore divide-and-conquer
algorithms and try out some new ES6 features like modules, classes, let,
and unpacking.

As of v0.2, Simplexify supports collinearity  by slightly fuzzing
the coordinates of collinear vertices.

Delaunay and Voronoi
----------------

A [Delaunay
triangulation](http://en.wikipedia.org/wiki/Delaunay_triangulation) is
the solution to a relatively simple question: what is the "best-looking"
way to connect a series of vertices with non-overlapping triangles? The
formal definition of "best-looking" is the Delaunay
condition—the requirement that no vertex lies within the
[circumcircle](http://mathworld.wolfram.com/Circumcircle.html) of any
triangle. Equivalently stated, the delaunay triangulation minimizes the
maximum angle in the set of triangles.

The [Voronoi diagram](http://en.wikipedia.org/wiki/Voronoi_diagram)
is the geometric dual of the Delaunay triangulation. It is formed by
connecting the circumcenters of all the triangles in the triangulation.

Build
-----

Simplexify uses [babel](https://babeljs.io) to transform es6 to es5 and
[browserify](http://browserify.org) to package it for the browser. To
use it, download `simplexify.js` from the releases tab on github and
include it on your webpage. It will add a `simplexify` object to
the global scope which exposes the `Delaunay` and `CanvasView`
constructors.

If you want to work on Simplexify locally, you'll need node or iojs, npm, and
gulp. Simply clone the repo and run `npm install`. Run `gulp demo` to
see a demo on localhost, and `gulp test` to run the test suite.
Compiled files will be stored in the `dist` folder.

Usage
-----

### `Delaunay(points)`

The Delaunay constructor returns an object which holds the state of the
triangulation. `points` is an array of objects with an x and a y
property. They will be used as the vertices in the Delaunay
Triangulation.

#### `#verts`
the vertices in the triangulation. Internal representation is subject to
change.

#### `#tris`
the triangles in the triangulation. Internal representation is subject to
change.

#### `#delaunay()`
computes the Delaunay triangulation.

#### `#voronoi()`
computes the circumcenters of all triangles. It will call `delaunay()`
if it has not yet been called.


### `CanvasView(canvas, delaunay, viewport)`

A CanvasView draws a `Delaunay` object onto `canvas`. `viewport` is the
part of the coordinate system that will actually be displayed. It is an
array of the form [x, y, width, height] with x and y describing the
top-left point of the viewport.

#### `#cx`
the canvas context for the view.

#### `#canvas`
a reference to the canvas element.

#### `#drawVerts(text)`
draws the vertices. If `text` is true, label them in order.

#### `#drawDelaunay(opts)`
draws the delaunay triangulation.

#### `#drawVoronoi(opts)`
draws the voronoi diagram.

`opts` is an optional object which may contain the following properties:
  - `clear`: clear canvas before drawing (default: true).
  - `verts`: draw vertices (default: false).
  - `vertLabels`: label vertices (has no effect without `verts`) (default: false).
  - `before`: callback with signature `function(o, i)` which is invoked
    before every step in the draw process. `o` is the primitive currently
    being drawn (a vertex for `drawVoronoi`, a triangle for
    `drawDelaunay`) and `i` is the number of draw iterations which have
    taken place. `this` will refer to the `CanvasView` object, so
    `this.cx.strokeStyle` will access the strokeStyle of the canvas
    context.
  - `after`: same as `before` but is called after every draw step.

Algorithm
---------

Simplexify uses a triangular data structure similar to the one explained
in [this paper](http://www.cs.berkeley.edu/~jrs/papers/triangle.pdf). A
triangulation begins with an array of points, which are simply objects
with an x and a y property. These points are transformed by the Delaunay
constructor into a more efficient representation which from now on will
be referred to as a vertex. These vertices contain their x and y
coordinates along with a reference to one of the triangles they belong
to. A triangle contains references to its three vertices (in
counter-clockwise order) and its three neighbors. Triangles on the edge
of the mesh are given a neighbor with a null vertex (a ghost triangle)
to reduce new allocations during the merge step.

The algorithm works by sorting the set of vertices into a flattened
2d-tree. Once sorted, the vertices are divided into sets of three and
two. Triangulations for these sets are trivial to create and do not
overlap because of the 2d-tree.

We then recursively merge these triangulations. First, we need to find
the upper and lower convex boundaries between them, which we use as the
start and endpoints of our merge process. We then iterate over the ghost
triangles on either side, transforming them into real triangles by
connecting their null vertex to a vertex from the other triangulation.
After each of these connections is made we check to see if the
triangulation satisfies the [Delaunay
condition](http://en.wikibooks.org/wiki/Trigonometry/For_Enthusiasts/Delaunay_triangulation#Formal_Definition)
and perform [edge
flips](http://en.wikipedia.org/wiki/Delaunay_triangulation#Visual_Delaunay_definition:_Flipping)
until it does.

Benchmarks
----------

Benchmarking was performed on a 2008 dual-core x86-64 Pentium T4300
2.1GHz processor with 3GB of RAM. You may benchmark on your own computer
by running `gulp build` followed by `node dist/benchmark.js`, which
calculates a delaunay triangulation for a randomly distributed set of
vertices. For 32768 vertices, it requires an average of 627ms, which is
roughly six times slower than the C++ implementation used by Yang, Choi
and Jung. This could be explained by the overhead of an interpreted
language, but it is likely that there is room for improvement in my
implementation.
