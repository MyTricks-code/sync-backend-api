import jwksRsa from 'jwks-rsa'
import jwt from 'jsonwebtoken'

const jwksClient = jwksRsa({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true
})

function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    const pubKey = key.getPublicKey()
    callback(null, pubKey)
  })
}

export async function verifyMicrosoftIdToken(idToken) {
  return new Promise((resolve, reject) => {
    if (!idToken) return reject(new Error('Missing id token'))

    const audience = process.env.MICROSOFT_CLIENT_ID
    const issuerTenant = process.env.AZURE_TENANT_ID || 'common'
    const issuer = `https://login.microsoftonline.com/${issuerTenant}/v2.0`

    jwt.verify(idToken, getKey, { algorithms: ['RS256'], audience, issuer }, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded)
    })
  })
}

export default verifyMicrosoftIdToken
