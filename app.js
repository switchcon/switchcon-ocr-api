const express = require('express')
const multer = require('multer');
const cors = require('cors');
const { createWorker } = require('tesseract.js');

const router = express.Router();
const app = express()
// cross origin requests header
const corsOpt = {
    origin: "*",
    credentials: false
}
app.use(cors(corsOpt))
app.use(express.static('public'))

const upload = multer({limit: {fileSize: 3 * 1024 * 1024}});

router.get("/", (req, res) => {
    res.sendFile('public/index.html')
})
// when post request received 
router.post('/upload', upload.single('image'),  async (req, res, err) => { 
    if (req.file)
    {
        let file = req.file;
        try{
            const worker = await createWorker('kor+eng');
            let v1 = await Promise.all([worker.recognize(file.buffer)]);
            let t = v1[0].data.text
            let vs = t.split('\n').map(s => s.replace(/\s+/g, ' '))
            let z1 =  vs
                        .filter((s) => 
                            ['유효기간', '주문번호', '교환처'].map( (q) => s.includes(q) )
                                                        .reduce((n, m) => n || m))
            let z2 = vs.filter(s => s.match(/([0-9\s]{12,20})/))[0].replace(/\D/g, "");
            let zx = z1.map((x) => x.split(/\s(.*)/g));
            let mm = {}
            mm[zx[0][0]] = zx[0][1];
            mm[zx[1][0]] = zx[1][1];
            mm[zx[2][0]] = zx[2][1];
            if (v1) res.json({expireDate: mm['유효기간'], orderNum: mm['주문번호'], storeName: mm['교환처'],barcodeNum: z2});
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