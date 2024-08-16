const bcrypt = require('bcrypt')


let CLEARTEXT="secret" // Set the password you want to choose here
const ROUNDS = 12 // The higher the safe, the longer it takes to generate/use the hash (also counts for the time to login)
let HASH = bcrypt.hashSync(CLEARTEXT, ROUNDS)
console.log(`The hash is: ${HASH}`)