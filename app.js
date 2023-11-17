const express = require('express');
const cors = require('cors');
const { createWorker } = require('tesseract.js');
const { getCategory } = require('./category.js')
const bp = require('body-parser');
const axios = require('axios');
const bpErrorHandler = require('express-body-parser-error-handler');
const router = express.Router();
const app = express();
// cross origin requests header
const corsOpt = {
    origin: "*",
    credentials: false
}
app.use(cors(corsOpt))
app.use(express.static('public'))
app.use(bp.json());
app.use(bp.urlencoded({
    extended: true
}));
app.use(bpErrorHandler());
router.get("/", (req, res) => {
    res.sendFile('public/index.html')
})

async function fetchfile(url_)
{
    let v = await axios({
        method: 'get',
        url: url_,
        responseType: 'stream'
    })
    let buf = []
    for await (const r of v.data)
        buf.push(r);
    let fin = Buffer.concat(buf);
    return fin;
}

// when post request received 
router.post('/upload',  bp.text({type:"*/*", limit: "5mb"}),async (req, res) => { 
    let f = req.body;
    if (f)
    {
        try{
            const worker = await createWorker('kor+eng').catch(e => res.json({status: "failed", msg: e.toString()}));
            let v1 = await Promise.all([worker.recognize(Buffer.from(f,'base64'))]).catch(e => res.json({status: "failed", msg: e.toString()}));
            let t = v1[0].data.text
            let vs = t.split('\n').map(s => s.replace(/\s+/g, ' '))
            let z1 =  vs
                        .filter((s) => 
                            ['유효기간', '주문번호', '교환처'].map( (q) => s.includes(q) )
                                                        .reduce((n, m) => n || m))
            let z2 = vs.filter(s => s.match(/([0-9\s]{12,20})/))[0].replace(/\D/g, "");
            let zx = z1.map((x) => x.split(/\s(.*)/g));
            let nameindex = vs.map(v =>/[0-9\s]{12,20}/g.test(v)).indexOf(true);
            let mm = {};
            mm[zx[0][0]] = zx[0][1];
            mm[zx[1][0]] = zx[1][1];
            mm[zx[2][0]] = zx[2][1];
            let modified = mm['교환처'].replaceAll('8', 'B').replaceAll('9', 'Q').replaceAll('0', 'Q').replaceAll('6', 'Q')
            if (v1) res.json({productName: vs[nameindex - 1], expireDate: mm['유효기간'], orderNum: mm['주문번호'], storeName: modified, category:getCategory(modified), barcodeNum: z2});
            else res.json({status: "failed!"});
        }catch(e)
        {
            res.json({status: "failed", msg: e.toString()});
            console.log('Error Occured', e.toString());
        }finally{
            //work
        }
    }
    else res.json({status: "failed!"});
})

app.use(router)
// run server
app.listen(3000, function(){ console.log("Server On - at localhost:3000"); });