import express from 'express'
import cors from 'cors'
// import moment from 'moment'
// import { ObjectId } from 'mongodb'
// import verifyToken from '../middlewares/verifyToken';
// import rateLimit from 'express-rate-limit'


export default function (_Context) {

    const router = express.Router()
    //cors 정책 설정 미들웨어 
    router.use(cors());

    router.use(express.raw({ limit: '500kb' })) //파일용량 1기가 바이트로 제한
    router.use(express.json({ limit: '500kb' })) //json 바디 미들웨어, content-type : application/json 일 경우 req.body로 받아온다.
    router.use(express.text({ limit: '500kb' })) //text 바디 미들웨어, content-type : application/text 일 경우 req.body로 받아온다.

    // router.use(verifyToken);

    // router.get('/', (req, res) => {
    //     res.json({ r: 'ok',info : 'veuro api v1.0'})
    // })

    router.get('/help', (req, res) => {
        res.json({ r: 'ok', info: _Context.server_info })
    });


    router.get('/getImage', (req, res) => {
        const bankId = parseInt(req.query.bankId);

        if (bankId === undefined) {
            res.json({ r: 'fail', info: 'bankId is empty' })
            return;
        }
        else {
            const _buffer = _Context.imageBuffer.getBuffer(bankId)

            if (_buffer) {
                // res.writeHead(200, { 'Content-Type': 'image/png'});

                if (_buffer.type === 1) {
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(_buffer.data, 'binary');
                }
                else if (_buffer.type === 2) {
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    res.end(_buffer.data, 'binary');
                }
                else if(_buffer.type === 100) {
                    

                    const index = parseInt(req.query.index);
                    if(index !== undefined) {
                        res.writeHead(200, { 'Content-Type': 'image/png' });

                        // console.log(_buffer.data[index].length)
                        
                        res.end(_buffer.data[index], 'binary');
                    }
                    else {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('no index')
                    }
                    // res.end('no image')
                }
                else {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('unkown type')
                // res.json({ r: 'fail', info: 'unkown type' })
                }
                
            }
            else {
                //send 404 error
                res.writeHead(400, { 'Content-Type': 'text/html' });
                // res.json({ r: 'fail', info: 'no buffer' })
                res.end('no buffer')
            }
        }

    })

    router.get('/getImageList', (req, res) => {

        const _list = _Context.tcpMirro.getBufferList()

        res.json({ r: 'ok', info: _list })
    })

    router.get('/getUdpSubscribers', (req, res) => {
            
            const _list = _Context.udpMirro.getSubbcribers()
    
            res.json({ r: 'ok', info: _list })
    });


    console.log('setup base api router')

    return router
}
