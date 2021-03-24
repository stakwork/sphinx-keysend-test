
var ByteBuffer = require('bytebuffer')
var LND = require('./lightning')
var path = require('path')
var grpc = require('grpc');

const env = process.env.NODE_ENV || 'production'
const config = require(__dirname + '/config.json')[env]

var routerClient;

const loadRouter = () => {
  if (routerClient) {
    return routerClient
  } else {
    try {
      var credentials = LND.loadCredentials('router.macaroon')
      var descriptor = grpc.load("proto/router.proto");
      var router = descriptor.routerrpc
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
        hop_pubkeys: dests.map(d=>ByteBuffer.fromHex(d)),
        final_cltv_delta: 144,
        amt_msat: amt ? amt*1000 : 3000,
      }
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

const sendToRoute = (opts) => { // dests: array of hex strings
  return new Promise(async (resolve, reject) => {
    let router = loadRouter()
    try {
      router.sendToRoute(opts, function (err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

module.exports={buildRoute,sendToRoute,loadRouter}
