import { message } from './myModule'
import add, { sub } from './math'

console.log('Message from myModule.js: ', message)
console.log('Default export from math.js - add: ', `2 + 2 = ${add(2, 2)}`)
console.log('Named export from math.js - sub: ', `2 - 1 = ${sub(2, 1)}`)
