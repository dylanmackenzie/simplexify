export function slowPartition(ar, e, p, r) {
  let copy = ar.slice(p, r+1).sort(function (a, b) {
    return a.p[e] - b.p[e]
  })

  let splice = [].splice.bind(ar, p, copy.length)
  splice.apply(ar, copy)
}

// partition
export function partition(ar, e, p, r) {
  let q = (p+r) >> 1

  while (r - p > 4) {
    // Partition array around median of medians
    let momi = medianOfMedians(ar, e, p, r)
    let mval = ar[momi].p[e]
    let left = p + 1, right = r
    swap(ar, p, momi)
    for (; right > left; left++) {
      if (ar[left].p[e] > mval) {
        while (ar[right].p[e] > mval && right > left) {
          --right
        }

        if (right <= left) {
          break
        }

        swap(ar, right, left)
      }
    }

    --left
    swap(ar, left, p)

    if (left > q) {
      r = left - 1
    } else if (left < q) {
      p = right
    } else {
      return
    }
  }

  return insertionSort(ar, e, p, r)
}

// selectMedian returns the index of the median of an array using the
// median of medians algorithm. It modifies the array from p to r. It
// uses an insertion sort to sort the small arrays due to its low
// overhead.
//
// Then do an insertion sort on each set of five and move the median
// to the first position in the subset
export function medianOfMedians(ar, e, p, r) {
  while (r - p > 4) {
    let i, j, lim = r - 4
    for (i = p, j = p; i < lim; i += 5, ++j) {
      swap(ar, i, select5(ar, e, i))
    }

    // Reset i to last valid index

    // Do an insertion sort on the last subset if it is not of length 5
    // and move its median to the front.
    if (i !== r) {
      insertionSort(ar, e, i, r)
      swap(ar, (i+r) >> 1, j)
      r = j
    } else {
      r = j - 1
    }
  }

  if (r - p === 4) {
    return select5(ar, e, p, 1)
  }

  insertionSort(ar, e, p, r)
  return (p+r) >> 1
}

// swap swaps ar[i] and ar[j]
function swap(ar, i, j) {
  let tmp = ar[i]
  ar[i] = ar[j]
  ar[j] = tmp
}

// insertionSort sorts ar from p to r inclusive using ar[i].p[e] as a
// discriminant
function insertionSort(ar, e, p, r) {
  for (let i = p+1; i <= r; ++i) {
    for (let j = i; j > p && ar[j-1].p[e] > ar[j].p[e]; --j)  {
      let tmp = ar[j]
      ar[j] = ar[j-1]
      ar[j-1] = tmp
    }
  }
}

// select5 returns the index of the median of ar[i1..i1+4] using the minimum number
// of comparisons
function select5(ar, e, i1) {
  let i2 = i1 + 1
  let i3 = i2 + 1
  let i4 = i3 + 1
  let i5 = i4 + 1

  // Ensure i1 < i2
  if (ar[i1].p[e] > ar[i2].p[e]) {
    swap(ar, i1, i2)
  }

  // Ensure i4 < i5
  if (ar[i4].p[e] > ar[i5].p[e]) {
    swap(ar, i4, i5)
  }

  // Ensure i1 < i4 && i2 < i5
  if (ar[i1].p[e] > ar[i4].p[e]) {
    swap(ar, i1, i4)
    swap(ar, i2, i5)
  }

  if (ar[i3].p[e] > ar[i2].p[e]) {
    if (ar[i2].p[e] < ar[i4].p[e]) {
      if (ar[i3].p[e] < ar[i4].p[e]) {
        return i3
      } else {
        return i4
      }
    } else {
      if (ar[i2].p[e] < ar[i5].p[e]) {
        return i2
      } else {
        return i5
      }
    }
  } else {
    if (ar[i3].p[e] > ar[i4].p[e]) {
      if (ar[i3].p[e] < ar[i5].p[e]) {
        return i3
      } else {
        return i5
      }
    } else {
      if (ar[i2].p[e] < ar[i4].p[e]) {
        return i2
      } else {
        return i4
      }
    }
  }
}
