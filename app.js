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

const upload = multer();

router.get("/", (req, res) => {
    res.sendFile('public/index.html')
})
// when post request received 
router.post('/upload', upload.single('image'), async (req, res) => { 
    if (req.file)
    {
        let file = req.file;
        const worker = await createWorker('kor+eng');
        let v1 = await Promise.all([worker.recognize(file.buffer)]);
        let t = v1[0].data.text
        if (v1) res.json({text:t});
        else res.json({status: "failed!"});
    }
    else res.json({status: "failed!"});
})

app.use(router)
// run server
app.listen(3000, function(){ console.log("Server On - at localhost:3000"); });