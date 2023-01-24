import express from 'express'
import dotenv from "dotenv"
import https from 'https'
import http from 'http'
import fs from 'fs'

import mirroTcpSetup from './component/mirror_tcp.js'
import mirroUdpSetup from './component/mirror_udp.js'
import imgBufferSetup from './component/imgbuffer.js'

//router
import baseApiRouter from './routers/base.js'

//catch unCaughtException , 
//unCaughtException 예외 발생시 다운되지않도록하기
process.on("uncaughtException", function (err) {
  console.error("uncaughtException (Node is alive)", err);
});


// const imageBuffer = []

// imageBuffer[0] = {
//     data : fs.readFileSync('./asakura.jpg'),
//     type : 0
// }

const theApp = {
  version : '0.0.1',
  packet_checkCode : 20221223,
  // imageBuffer : []
};


(async function () {

  // console.log(SocketIO_version);
  dotenv.config({ path: '.env' }); //환경 변수에 등록 
  console.log(`run mode : ${process.env.NODE_ENV}`);

  theApp.server_info = {
    tcp_port: process.env.TCP_PORT,
    web_port: process.env.WEB_PORT,
  }

  theApp.imageBuffer = await imgBufferSetup({ context: theApp });

  
  const app = express()

  // app.use('/tipAndTrick', express.static('./tipAndTrick'));
  // app.use('/media', express.static(`./media`));
  // app.use('/webrtc', express.static(`./webrtc`));

  app.use('/', express.static(process.env.WEB_ROOT));
  app.use('/api/v1', baseApiRouter(theApp));


  // console.log(__dirname)

  //순서 주의 맨 마지막에 나온다.
  app.all('*', (req, res) => {
    res
      .status(404)
      .send('oops! resource not found')
  });

  let baseServer;
  if (process.env.SSL === 'True') {
    console.log(`SSL mode ${process.env.SSL}`);
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY),
      cert: fs.readFileSync(process.env.SSL_CERT),
      ca: fs.readFileSync(process.env.SSL_CA),
    };
    // https 서버를 만들고 실행시킵니다
    baseServer = https.createServer(options, app)

  }
  else {
    console.log('run http mode');
    baseServer = http.createServer({}, app)
  }


  await new Promise((resolve, reject) => {

    baseServer.listen(process.env.WEB_PORT, () => {
      console.log(`api server run at : ${process.env.WEB_PORT}`)
      resolve();
    });
  })

  theApp.expressApp = app

  //mirror server
  theApp.tcpMirro = await mirroTcpSetup({ port: process.env.TCP_PORT, context: theApp })
  theApp.udpMirro = await mirroUdpSetup({ port: process.env.UDP_PORT, context: theApp })



})()








