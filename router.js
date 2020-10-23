
var ByteBuffer = require('bytebuffer')
var LND = require('./lightning')
var path = require('path')
var protoLoader = require("@grpc/proto-loader")
var grpc = require('grpc');
var Buffer = require('buffer').Buffer;

const includePath = path.join(__dirname, "./proto")
console.log("includePath:", includePath)
const opts = {
  includeDirs: [includePath]
}

const env = process.env.NODE_ENV || 'production'
const config = require(__dirname + '/config.json')[env]

var routerClient;

const loadRouter = () => {
  if (routerClient) {
    return routerClient
  } else {
    try {
      var credentials = LND.loadCredentials('router.macaroon')
      var descriptor = protoLoader.loadSync('router.proto', opts)
      const defn= grpc.loadPackageDefinition(descriptor);
      var router = defn.routerrpc
      routerClient = new router.Router(config.node_ip + ':' + config.lnd_port, credentials);
      return routerClient
    } catch (e) {
      throw e
    }
  }
}

const buildRoute = (dests, amt) => { // dests: array of hex strings
  return new Promise(async (resolve, reject) => {
    let router = loadRouter()
    try {
      const options = {
        hop_pubkeys: dests.map(d=>Buffer.from(d,'hex').toString('base64')),//dests.map(d=>ByteBuffer.fromHex(d)),
        final_cltv_delta: 144,
        amt_msat: amt ? amt*1000 : 3000,
      }
      console.log("OPTIONS,",options)
      router.buildRoute(options, function (err, route) {
        if (err) {
          reject(err)
        } else {
          resolve(route)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

module.exports={buildRoute}
