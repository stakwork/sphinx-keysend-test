const LND = require('./lightning')
const signer = require('./signer')

function subscribeInvoices(onReceive) {
  return new Promise(async (resolve, reject) => {
    const lightning = await LND.loadLightning()

    var call = lightning.subscribeInvoices()
    call.on('data', async function (response) {
      if (response['state'] !== 'SETTLED') {
        return
      }
      // console.log("IS KEYSEND", response.is_keysend)
      if (response.is_keysend) {
        parseKeysendInvoice(response, onReceive)
      }
    });
    call.on('status', function (status) {
      console.log("Status", status);
      // The server is unavailable, trying to reconnect.
      if (!(status.code == ERR_CODE_UNAVAILABLE || status.code == ERR_CODE_STREAM_REMOVED)) {
        resolve(status);
      }
    })
    call.on('error', function (err) {
      console.error('[LND] Error', now, err.code)
      if (!(err.code == ERR_CODE_UNAVAILABLE || err.code == ERR_CODE_STREAM_REMOVED)) {
        reject(err)
      }
    })
    call.on('end', function () {
      console.log(`Closed stream ${now}`);
    })
    setTimeout(() => {
      resolve(null)
    }, 100)
  })
}

async function parseKeysendInvoice(i, onReceive) {
  const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records
  const buf = recs && recs[LND.SPHINX_CUSTOM_RECORD_KEY]
  const data = buf && buf.toString()
  const value = i && i.value && parseInt(i.value)
  if (!data) return

  let payload
  if (data[0] === '{') {
    try {
      payload = await parseAndVerifyPayload(data)
    } catch (e) { }
  }
  if (payload) {
    const dat = payload
    if (value && dat && dat.message) {
      dat.message.amount = value // ADD IN TRUE VALUE
    }
    onReceive(dat)
  } else {
    console.log("could not validate")
  }
}

// VERIFY PUBKEY OF SENDER from sig
async function parseAndVerifyPayload(data) {
  let payload
  const li = data.lastIndexOf('}')
  const msg = data.substring(0, li + 1)
  const sig = data.substring(li + 1)
  try {
    payload = JSON.parse(msg)
    if (payload && payload.sender && payload.sender.pub_key) {
      let v
      if (sig.length === 96 && payload.sender.pub_key) {
        v = await signer.verifyAscii(msg, sig, payload.sender.pub_key)
      }
      if (v && v.valid) {
        return payload
      }
    }
  } catch (e) {
    console.log(e)
    return null
  }
}

module.exports = {
  subscribeInvoices
}