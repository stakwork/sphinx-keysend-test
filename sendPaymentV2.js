var router = require('./router')
var minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const payment_request = args.payreq

/*
export NODE_ENV=proxy_lnd
node ./sendPaymentV2 --payreq=lnbc10u1pswwdxypp52236w8cgp7ctdujs9ljvh6aw87ujvhj4myzw9vp40vcgta0em86qdqqcqzpgsp54j66a2dun0wzjtddm3wp89kee60qu9nptty05rhf76h0kmpr63gq9qyyssq3d9csz4g7her5zaefalqddsyx7akara9h37awqrc69y5ps4m96xjuekhxqat0l9qjpgg3xp4jfy8l0tv2kfu655xp4janl9vk9rud3gpd35sd4
*/

const r = router.loadRouter()
const opts = {
    payment_request,
    timeout_seconds: 16
}
const call = r.sendPaymentV2(opts)
call.on('data', function (payment) {
    console.log(payment)
    const state = payment.status || payment.state
    if (payment.payment_error) {
        reject(payment.payment_error)
    } else {
        if (state === 'IN_FLIGHT') {
        } else if (state === 'FAILED_NO_ROUTE') {
            reject(payment.failure_reason || payment)
        } else if (state === 'FAILED') {
            reject(payment.failure_reason || payment)
        } else if (state === 'SUCCEEDED') {
            resolve(payment)
        }
    }
})
call.on('error', function (err) {
    reject(err)
})

function reject(m) {
    console.log("fail", m)
}

function resolve(m) {
    console.log("success", m)
}