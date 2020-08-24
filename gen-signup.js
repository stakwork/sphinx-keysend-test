


var theIP = 'nodl-lnd-s008-046.s008.nodl.it'
var password = ''

function go(){
    const b64 = Buffer.from(`ip::${theIP}::${password||''}`).toString('base64')
    console.log(b64)
}

/*
UPDATE sphinx_contacts SET auth_token=null, contact_key=null WHERE id=1;
*/

go()