
var minimist = require('minimist')
var router = require('./router')

function jlog(s) {
    console.log(JSON.stringify(s, null, 2))
}

/*
node route.js --hops=023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f,0227230b7b685f1742b944bfc5d79ddc8c5a90b68499775ee10895f87307d8d22e,02a0591e848d24246a349fe61c5d7a86bab7c3d9598366675b9c91deb3e31ddf57,03e278ab0ed1f0b21af7280428d4f00a542aa8be703ccce1be285596645d64a827
*/

async function test() {
  const args = minimist(process.argv.slice(2))
  const hops = args['hops']
  if (!hops) {
      return console.log("NO HOPS")
  }

  const hs = hops.split(',')
  try { 
    const r = await router.buildRoutes(hs,3)
    consolel.log(r)
  } catch(e) {
    console.log("ERROR",e)
  }
}

test()