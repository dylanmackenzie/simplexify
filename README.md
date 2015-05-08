Simplexify
==========

![Voronoi Diagram which follows mouse cursor](https://github.com/dylanmackenzie/simplexify/blob/master/gh-pages/animated-voronoi.gif)

Simplexify implements a [divide-and-conquer
algorithm](http://link.springer.com/article/10.1007%2Fs12541-011-0056-1)
for calculating a Delaunay triangulation (and Voronoi diagram) in Javascript. It
runs in O(n log n) time, and was written mainly to explore divide-and-conquer
algorithms and try out some new ES6 features like modules, classes, let,
and unpacking.

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

We then recursively merge these triangulations by finding the upper and
lower convex boundaries between them, transforming the ghost triangles
on one side into real triangles by connecting their null vertex to the
other side. After each of these connections is made we check to see if
the triangulation satisfies the [Delaunay
condition](http://en.wikibooks.org/wiki/Trigonometry/For_Enthusiasts/Delaunay_triangulation#Formal_Definition)
and perform [edge
flips](http://en.wikipedia.org/wiki/Delaunay_triangulation#Visual_Delaunay_definition:_Flipping)
until it does.

Visualization
-------------

Simplexify provides a CanvasView class for displaying a triangulation on
a given canvas. The CanvasView provides `before` and `after` hooks for
styling the visualization. Read the docs for more information.

Building
--------

Simplexify uses [babel](https://babeljs.io) to transform es6 to es5 and
[browserify](http://browserify.org) to package it for the browser. Run
`gulp demo` to see a demo on localhost, and `gulp test` to run the test
suite.
