var rrr = require('./router')
var minimist = require('minimist')
var ByteBuffer = require('bytebuffer')
var crypto = require('crypto')
var sha = require('js-sha256')

const LND_KEYSEND_KEY = 5482373484
const SPHINX_CUSTOM_RECORD_KEY = 133773310

const keysend2 = (opts) => {
  return new Promise(async function (resolve, reject) {
    const FEE_LIMIT_SAT = 10;
    const randoStr = crypto.randomBytes(32).toString("hex");
    const preimage = ByteBuffer.fromHex(randoStr);
    const options = {
      amt: opts.amt || 3,
      final_cltv_delta: 10,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features: [9],
    };
    // add in route hints
    if (opts.route_hint && opts.route_hint.includes(":")) {
      const arr = opts.route_hint.split(":");
      const node_id = arr[0];
      const chan_id = arr[1];
      options.route_hints = [
        {
          hop_hints: [{ node_id, chan_id }],
        },
      ];
    }
    // console.log("SEND sendPaymentV2", options)
    // new sendPayment (with optional route hints)
    options.fee_limit_sat = FEE_LIMIT_SAT;
    options.timeout_seconds = 16;
    const router = await rrr.loadRouter();
    const call = router.sendPaymentV2(options);
    call.on("data", function (payment) {
      const state = payment.status || payment.state;
      if (payment.payment_error) {
        reject(payment.payment_error);
      } else {
        if (state === "IN_FLIGHT") {
        } else if (state === "FAILED_NO_ROUTE") {
          reject(payment);
        } else if (state === "FAILED") {
          reject(payment);
        } else if (state === "SUCCEEDED") {
          resolve(payment);
        }
      }
    });
    call.on("error", function (err) {
      reject(err);
    });
    // call.write(options)
  });
};

async function send() {
  try {
    const args = minimist(process.argv.slice(2))
    const dest = args['dest']
    const route_hint = args['route_hint'] || ''
    const amount = args['amt']
    const amt = parseInt(amount) || 0
    if(!dest){
      return console.log("NO DEST")
    }
    const opts = {dest, route_hint, amt}
    const r = await keysend2(opts)
    console.log("=> KEYSEND SUCCESS", r)
  } catch(e) {
    console.log('ERROR', e)
  }
}

send()
