var router = require('./router')
var minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const payment_request = args.payreq

/*
export NODE_ENV=proxy_lnd
node ./sendPaymentV2 --payreq=lnbc10010n1psww3kcpp5kn39xxvcle7yapml336kxlq0l7k44r2vwftgctqghgewwe2us64qdqqcqzpgsp52aywz72ecs0qfuqwpwx38lk4fhg8k566wac3ppmmn6j7wqz6z4tq9qyyssqurt5esae4hksltpgrr93ek63vht64h04rgwjgyu6rvfku2tn845ntzkl7dtdfj8qp4gumdpuvt8wck3tmt5v4gfwtx0egtwwzfr8ylcpr3stgm
*/

const r = router.loadRouter()
const opts = {
    payment_request,
    timeout_seconds: 16,
    fee_limit_sat: 10,
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