
// Use a pool of already created guids to optimize performance
// in areas of the code that quickly request thousands of guids:
const POOL_SIZE = 1000;
const pool : number[] = [];

// Used to track our hit rate for tuning purposes
let hits = 0;
let misses = 0;

// Fill the pool up to its configured max size
function fillPool() {
  createSome(POOL_SIZE - pool.length).forEach(n => pool.push(n));
}

// Every second, refill the pool.
const schedule = () => setTimeout(() => { fillPool(); schedule(); }, 5000);

// Start refilling the pool.
schedule();

// Request a guid
export default function guid() : string {

  // If we have a guid available, take it
  if (pool.length > 0) {
    hits = hits + 1;
    // pop() is the fastest way to do get an item.
    // It is O(1) relative to the size of the array
    return (pool.pop() as any) + '';
  }

  // The pool was empty so we need to create one
  // for this request
  misses = misses + 1;
  fillPool();

  return (pool.pop() as any) + '';
}

function createSome(count: number) {
  const array = new Uint32Array(count);

  if (window.crypto !== undefined) {
    window.crypto.getRandomValues(array);
  } else {
    // This clause allows guid to operate in headless testing environments
    // where window.crypto may be undefined
    for (let i = 0; i < count; i += 1) {
      array[i] = Math.floor(Math.random() * Math.floor(Math.pow(2, 32) - 1));
    }
  }

  return array;

}

export function createRFC4122Guid() {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return 'dxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[dxy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);

    if (c === 'x') {
      return r.toString(16);
    }
    if (c === 'y') {
      return (r & 0x3 | 0x8).toString(16);
    }

    return (((d + Math.random() * 6) % 6 | 0) + 10).toString(16);
  });
}


(window as any).guid = guid;
