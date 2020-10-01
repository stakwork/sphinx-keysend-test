
var grpc = require('grpc')
var ByteBuffer = require('bytebuffer')
var lightning = require('./lightning')

const env = process.env.NODE_ENV || 'production'
const config = require(__dirname + '/config.json')[env]

// var protoLoader = require('@grpc/proto-loader')
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env]

var signerClient;

const loadSigner = () => {
  if (signerClient) {
    return signerClient
  } else {
    try {
      var credentials = lightning.loadCredentials()
      var lnrpcDescriptor = grpc.load("signer.proto");
      var signer = lnrpcDescriptor.signrpc
      signerClient = new signer.Signer(config.node_ip + ':' + config.lnd_port, credentials);
      return signerClient
    } catch (e) {
      throw e
    }
  }
}

const signMessage = (msg) => {
  return new Promise(async (resolve, reject) => {
    let signer = await loadSigner()
    try {
      const options = {
        msg: ByteBuffer.fromHex(msg),
        key_loc: { key_family: 6, key_index: 0 },
      }
      signer.signMessage(options, function (err, sig) {
        if (err || !sig.signature) {
          reject(err)
        } else {
          const buf = ByteBuffer.wrap(sig.signature);
          resolve(buf.toBase64())
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

async function signAscii(ascii) {
  try {
    const sig = await signMessage(ascii_to_hexa(ascii))
    return sig
  } catch (e) {
    throw e
  }
}

function ascii_to_hexa(str) {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join('');
}

module.exports={
  signAscii
}