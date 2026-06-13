// if you are using this then your cooked
// this was created to get a hex 32bit string to save time on hashing a human readable string on every encrypt call in ./helpers/crypto.js
// Loss of Master key will result in corruption of the whole data that is saved in db until now
import crypto from "crypto"
console.log(crypto.randomBytes(32).toString("hex"))