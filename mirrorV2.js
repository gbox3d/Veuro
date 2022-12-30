// var net = require('net');
import fs from 'fs';
import net from 'net'

const packet_checkCode = 20221223
const headerPacket_size = 8

let imageBuffer = []
let detected = []

imageBuffer[0] = fs.readFileSync('./asakura.jpg')

// console.log(`imageBuffer[0].length : ${imageBuffer[0].length}`)

// imageBuffer[1] = fs.readFileSync('./image2.jpg')
// imageBuffer[2] = fs.readFileSync('../sample/bird1.jpg')
// imageBuffer[3] = fs.readFileSync('../sample/bird1.jpg')

function getDetectedStatus(_bank_index) {
    return detected[_bank_index]
}

function getBuffer(_bank_index) {
    return imageBuffer[_bank_index]
}

function setBuffer(_bank_index, data) {
    imageBuffer[_bank_index] = data
}

export default async function ({ port, context }) {

    //catch unCaughtException , 
    //unCaughtException 예외 발생시 다운되지않도록하기
    process.on("uncaughtException", function (err) {
        console.error("uncaughtException (Node is alive)", err);
    }
    );



    const server_socket = net.createServer(async function (client_socket) {

        function _processPacketBase(_packet) {
            let _checkcode = _packet.readUInt32LE(0)

            if (_checkcode !== packet_checkCode)
                return false

            let _cmd = _packet.readUInt8(4)

            switch (_cmd) {
                case 0: //wellcome
                    console.log('wellcome')
                    break;
                case 0x01: //upload image
                    {

                    }
                    break;
                case 0x02:
                    {
                        const _bank_index = _packet.readUInt8(5)
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        if (imageBuffer[_bank_index]) {
                            res_packet.writeUInt32LE(imageBuffer[_bank_index].length, 4)
                            client_socket.write(Buffer.concat([res_packet, imageBuffer[_bank_index]]))
                        }
                        else {
                            res_packet.writeUInt32LE(0, 4)
                            client_socket.write(res_packet)

                        }
                    }
                    break;
                case 0x10: //ping
                    {
                        console.log('ping')
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)

                        client_socket.write(res_packet)
                    }
                    break;
                case 0x11: //pong
                    {
                        console.log('pong')


                    }
                default:
                    {
                        console.log('unknown packet')
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)

                        client_socket.write(res_packet)

                        break;
                    }

            }
            // let _index = _packet.readUInt8(6)
            // let _bank_index = _packet.readUInt8(7)
            // return {code:_code,index:_index,bank_index:_bank_index}
        }

        try {
            // We have a connection - a socket object is assigned to the connection automatically
            console.log('CONNECTED: ' + client_socket.remoteAddress + ':' + client_socket.remotePort);

            let data_handler = _processPacketBase

            client_socket.on('data', (_) => {

                if (data_handler)
                    data_handler(_)
                else {
                    console.log(_)
                }
            });

            // Add a 'close' event handler to this instance of socket
            client_socket.on('close', function (data) {
                console.log('CLOSED: ' + client_socket.remoteAddress + ':' + client_socket.remotePort);
            });

            //welcome packet 
            let _welcome = Buffer.alloc(8)
            _welcome.writeUInt32LE(packet_checkCode)
            _welcome.writeUInt8(0, 4)
            _welcome.writeUInt8(0, 5)
            _welcome.writeUInt8(1, 6)
            _welcome.writeUInt8(0, 7)

            client_socket.write(_welcome)

        }
        catch (e) {
            console.log(e)
        }

    })
    server_socket.listen(port);

    console.log('img mirror Server listening on ' + ':' + port);

    return {
        getBuffer, setBuffer, getDetectedStatus,
        server_socket
    }
}

// export default {
//     setup, getBuffer,setBuffer,getDetectedStatus
// }
// export { setup, getBuffer,setBuffer,getDetectedStatus }
// export { getBuffer }




