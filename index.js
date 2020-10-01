
var minimist = require('minimist')
var lightning = require('./lightning')

// no-rest
// no-bootstrap

// no syncing graph

function jlog(s) {
  console.log(JSON.stringify(s, null, 2))
}

async function test(){
  const args = minimist(process.argv.slice(2))
  const dest = args['dest']
  if(!dest){
    return console.log("NO DEST")
  }
  const opts = {dest}
  try {
    const r = await lightning.keysend(opts)
    console.log("=> KEYSEND SUCCESS")
    const hops = r.hops||[]
    jlog({
      ...r,
      ...r.payment_hash && {payment_hash: r.payment_hash.toString('hex')},
      ...r.payment_preimage && {payment_preimage: r.payment_preimage.toString('hex')},
      ...r.payment_route && {payment_route: {
        ...r.payment_route,
        hops: (r.payment_route.hops||[]).map(h=> {
          return {...h, custom_records:{}}
        })
      }},
      
    })
  } catch(e) {
    console.log(e)
    console.log("=> KEYSEND FAILURE")
    jlog({
      payment_error: e
    })
  }
  process.exit(0)
}

test()