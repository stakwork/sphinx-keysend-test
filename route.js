
var minimist = require('minimist')
var router = require('./router')
var crypto = require('crypto')
var ByteBuffer = require('bytebuffer')
var sha = require('js-sha256')

const LND_KEYSEND_KEY = 5482373484
const SPHINX_CUSTOM_RECORD_KEY = 133773310

function jlog(s) {
    console.log(JSON.stringify(s, null, 2))
}

/*
node route.js --hops=023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f,0227230b7b685f1742b944bfc5d79ddc8c5a90b68499775ee10895f87307d8d22e,02a0591e848d24246a349fe61c5d7a86bab7c3d9598366675b9c91deb3e31ddf57,03e278ab0ed1f0b21af7280428d4f00a542aa8be703ccce1be285596645d64a827
node route.js --hops=023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f,0227230b7b685f1742b944bfc5d79ddc8c5a90b68499775ee10895f87307d8d22e
*/

async function test() {
  const args = minimist(process.argv.slice(2))
  const hops = args['hops']
  if (!hops) {
      return console.log("NO HOPS")
  }

  const hs = hops.split(',')
  try { 
    const r = await router.buildRoute(hs,3)
    console.log(r)
    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    r.route.hops = r.route.hops.map((h,i)=>{
      if(i===r.route.hops.length-1) {
        return {...h, custom_records:{
          [`${LND_KEYSEND_KEY}`]: preimage,
          // [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data || '{}'),
        }}
      }
      return h
    })
    console.log(r.route.hops)
    r.payment_hash = sha.sha256.arrayBuffer(preimage.toBuffer()),
  } catch(e) {
    console.log("ERROR",e)
  }
}

test()