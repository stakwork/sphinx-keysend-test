
var minimist = require('minimist')
var LND = require('./lightning')
var signer = require('./signer')
var sub = require('./subscribe')

function jlog(s) {
    console.log(JSON.stringify(s, null, 2))
}

async function test() {
    const args = minimist(process.argv.slice(2))
    const dest = args['dest']
    if (!dest) {
        return console.log("NO DEST")
    }

    sub.subscribeInvoices(function(){
        console.log("=> RECEIVED KEYSEND RESPONSE!")
        process.exit(0)
    })
    setTimeout(()=>{
        console.log("NEVER RECEIVED RESPONSE")
        process.exit(0)
    },15000)

    const amt = 10
    const pub_key = await LND.getMyPubKey()
    let data = JSON.stringify({
        type: 26, // heartbeat type
        message: { amount: amt },
        sender: {pub_key}
    })
    const sig = await signer.signAscii(data)
    data = data + sig
    const opts = {amt,dest,data}
    try {
        const r = await LND.keysend(opts)
        console.log("=> KEYSEND SUCCESS")
    } catch (e) {
        console.log(e)
        console.log("=> KEYSEND FAILURE")
        jlog({
            payment_error: e
        })
    }
}

test()
