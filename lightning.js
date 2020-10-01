
var fs = require('fs')
var grpc = require('grpc')
var crypto = require('crypto')
var ByteBuffer = require('bytebuffer')
var sha = require('js-sha256')

const env = process.env.NODE_ENV || 'production'
const config = require(__dirname + '/config.json')[env]

const LND_KEYSEND_KEY = 5482373484
const SPHINX_CUSTOM_RECORD_KEY = 133773310

function keysend(opts) {
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning()

    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    const options = {
      amt: opts.amt || 3,
      final_cltv_delta: 144,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
        [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data || '{}'),
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features: [9],
    }
    const call = lightning.sendPayment()
    call.on('data', function (payment) {
      if (payment.payment_error) {
        reject(payment.payment_error)
      } else {
        resolve(payment)
      }
    })
    call.on('error', function (err) {
      reject(err)
    })
    call.write(options)
  })
}

function getMyPubKey() {
  return new Promise(async function (resolve, reject) {
    const lightning = await loadLightning()
    var request = {}
    lightning.getInfo(request, function (err, response) {
      if (err) reject(err)
      if (!response.identity_pubkey) reject('no pub key')
      else resolve(response.identity_pubkey)
    });
  })
}

var lightningClient

const loadCredentials = () => {
  var lndCert = fs.readFileSync(config.tls_location);
  var sslCreds = grpc.credentials.createSsl(lndCert);
  var m = fs.readFileSync(config.macaroon_location);
  var macaroon = m.toString('hex');
  var metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon)
  var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    callback(null, metadata);
  });

  return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
}

const loadLightning = () => {
  if (lightningClient) {
    return lightningClient
  } else {
    try {
      var credentials = loadCredentials()
      var lnrpcDescriptor = grpc.load("rpc.proto");
      var lnrpc = lnrpcDescriptor.lnrpc
      lightningClient = new lnrpc.Lightning(config.node_ip + ':' + config.lnd_port, credentials);
      return lightningClient
    } catch (e) {
      throw e
    }
  }
}

module.exports = {
  keysend, getMyPubKey, loadCredentials
}