
var ByteBuffer = require('bytebuffer')
var LND = require('./lightning')
var path = require('path')
var protoLoader = require("@grpc/proto-loader")

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
      console.log("DESC,",descriptor)
      var router = descriptor.routerrpc
      console.log("RPOTUEr",router)
      routerClient = new router.Router(config.node_ip + ':' + config.lnd_port, credentials);
      return routerClient
    } catch (e) {
      throw e
    }
  }
}

const buildRoutes = (dests, amt) => { // dests: array of hex strings
  return new Promise(async (resolve, reject) => {
    let router = await loadRouter()
    try {
      const options = {
        hop_pubkeys: dests.map(d=>ByteBuffer.fromHex(d)),
        final_cltv_delta: 144,
        amt_msat: amt ? amt*1000 : 3000,
      }
      router.buildRoutes(options, function (err, route) {
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

module.exports={
  buildRoutes
}