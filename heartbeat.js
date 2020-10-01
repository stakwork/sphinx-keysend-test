
var minimist = require('minimist')
var lightning = require('./lightning')
var signer = require('./signer')

function jlog(s) {
    console.log(JSON.stringify(s, null, 2))
}

async function test() {
    const args = minimist(process.argv.slice(2))
    const dest = args['dest']
    if (!dest) {
        return console.log("NO DEST")
    }
    const amt = 10
    const pub_key = await lightning.getMyPubKey()
    let data = JSON.stringify({
        type: 26, // heartbeat type
        message: { amount: amt },
        sender: {pub_key}
    })
    const sig = await signer.signAscii(data)
    data = data + sig
    const opts = {amt,dest,data}
    try {
        const r = await lightning.keysend(opts)
        console.log("=> KEYSEND SUCCESS")
    } catch (e) {
        console.log(e)
        console.log("=> KEYSEND FAILURE")
        jlog({
            payment_error: e
        })
    }
    process.exit(0)
}

test()