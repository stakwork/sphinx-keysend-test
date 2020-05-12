var fs = require('fs')
var grpc = require('grpc')
var minimist = require('minimist')
var crypto = require('crypto')
var ByteBuffer = require('bytebuffer')
var sha = require('js-sha256')
var path = require('path')

// no-rest
// no-bootstrap

// no syncing graph

const env = process.env.NODE_ENV || 'production'
const config = require(path.join(__dirname,'/config.json'))[env]

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
    const r = await keysend(opts)
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

const LND_KEYSEND_KEY = 5482373484

function keysend(opts) {
  return new Promise(async function(resolve, reject) {
    let lightning = await loadLightning()

    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    const options = {
      amt: opts.amt || 3,
      final_cltv_delta: 144,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features:[9],
    }
    const call = lightning.sendPayment()
    call.on('data', function(payment) {
      if(payment.payment_error){
        reject(payment.payment_error)
      } else {
        resolve(payment)
      }
    })
    call.on('error', function(err) {
      reject(err)
    })
    call.write(options)
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

test()