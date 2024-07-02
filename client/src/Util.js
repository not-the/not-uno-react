/** Shuffles are array by modifying it, then returns original array (now shuffled)
 * https://stackoverflow.com/a/2450976/11039898
*/
export function shuffle(array) {
   let currentIndex = array.length;

   // While there remain elements to shuffle...
   while(currentIndex !== 0) {
       // Pick a remaining element...
       let randomIndex = Math.floor(Math.random() * currentIndex);
       currentIndex--;

       // And swap it with the current element.
       [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
   }

   return array;
}

/** Repeat function
 * https://stackoverflow.com/a/35556907/11039898
 * @param {Function} func 
 * @param {Number} times 
 */
export function repeat(func, times=1) {
    func();
    times && --times && repeat(func, times);
}

// Uses modulus operator to keep value within amount
export function clamp(value, max) {
    return ((value % max) + max) % max;
}

/** Stores objects using localStorage */
export function store(key, value) { return value ? localStorage.setItem(key, JSON.stringify(value)) : JSON.parse(localStorage.getItem(key)); }