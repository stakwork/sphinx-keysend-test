var router = require('./router')
var minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const payment_request = args.payreq

const r = router.loadRouter()
const call = r.sendPaymentV2({payment_request})
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