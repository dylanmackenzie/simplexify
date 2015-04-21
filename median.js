// median returns the index of the median element in given array
export function median(ar, j, p, r) {
  var e = j & 1
  var copy = ar.slice(p, r+1).sort(function (a, b) {
    return a.p[e] - b.p[e]
  })

  return ar.indexOf(copy[((p+r)>>1) - p])
}

// median partitions elements in ar around the median
export function partition(ar, j, p, r) {
  var q = (p+r) >> 1
  var e = j & 1

  // m is the index of the median element of the array
  var m = median(ar, j, p, r)

  // move the median to the middle of the array
  var tmp = ar[m]
  ar[m] = ar[q]
  ar[q] = tmp

  // iterate over the left half of the array,.swapping misplaced
  // elements with ones from the other side
  var med = tmp.p[e]
  for (var left = p, right = q+1; left < q; ++left) {
    // if an element on the left is bigger than the median, we need to
    // swap it
    if (ar[left].p[e] > med) {
      // increase right index until we find one that can be swapped
      while (ar[right].p[e] > med) {
        right++
      }
      // swap
      tmp = ar[right]
      ar[right] = ar[left]
      ar[left] = tmp
    }
  }

  // clean up the right side of the array, we may have some elements
  // which are equal to the median which must be swapped
  var left = p
  while (right < r) {
    right++
    if (ar[right].p[e] < med) {
      while (ar[left].p[e] < med) {
        left++
      }
      // swap
      tmp = ar[right]
      ar[right] = ar[left]
      ar[left] = tmp
    }
  }

  return ar
}
