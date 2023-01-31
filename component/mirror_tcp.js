// var net = require('net');
import fs from 'fs';
import net from 'net'
// import { type } from 'os';

const packet_checkCode = 20221223
const headerPacket_size = 32


// // console.log(`imageBuffer[0].length : ${imageBuffer[0].length}`)

// // imageBuffer[1] = fs.readFileSync('./image2.jpg')
// // imageBuffer[2] = fs.readFileSync('../sample/bird1.jpg')
// // imageBuffer[3] = fs.readFileSync('../sample/bird1.jpg')

// function getDetectedStatus(_bank_index) {
//     return detected[_bank_index]
// }
// let imageBuffer;


export default async function ({ port, context }) {

    const imageBuffer = context.imageBuffer.buffer

    function getBuffer(_bank_index) {
        return imageBuffer[_bank_index]
    }
    
    function setBuffer(_bank_index, data) {
        imageBuffer[_bank_index] = data
    }
    

    const server_socket = net.createServer(async function (client_socket) {

        let _currentBank = -1;
        let _uploadSize = 0;
        let tempBuffer = null;

        let data_handler = _processPacketBase

        function _processUploadPacket(_packet) {

            if (_uploadSize > 0) {

                if (tempBuffer) {
                    tempBuffer = Buffer.concat([tempBuffer, _packet])
                }
                else {
                    tempBuffer = _packet
                }

                _uploadSize -= _packet.length

                if (_uploadSize <= 0) {

                    // console.log('upload complet ', _uploadSize)
                    data_handler = _processPacketBase //header parsing mode

                    if (_uploadSize == 0) {
                        imageBuffer[_currentBank].data = tempBuffer
                        tempBuffer = null
                    }
                    else if (_uploadSize < 0) {
                        const _data_end = tempBuffer.length + _uploadSize
                        imageBuffer[_currentBank].data = tempBuffer.slice(0, _data_end)
                        
                        // tempBuffer = tempBuffer.slice(_data_end)

                        const _leftSize = 0 - _uploadSize

                        if ( _leftSize >= headerPacket_size) {
                            let _packet = tempBuffer.slice(_data_end)
                            tempBuffer = null
                            data_handler( _packet )
                        }
                        else {
                            tempBuffer = tempBuffer.slice(_data_end)
                        }
                        
                        
                    }
                }


            }

        }

        function _processPacketBase(_packet) {

            if (tempBuffer) {
                tempBuffer = Buffer.concat([tempBuffer, _packet])
            }
            else {
                tempBuffer = _packet
            }

            if (tempBuffer.length < headerPacket_size) {
                return
            }

            const _headerPacket = tempBuffer.slice(0, headerPacket_size)


            let _checkcode = _headerPacket.readUInt32LE(0)

            if (_checkcode !== packet_checkCode) {

                // console.log('check code error')
                tempBuffer = null
                return false
            }
            else {
                if (tempBuffer.length == headerPacket_size) {
                    tempBuffer = null
                }
                else {
                    tempBuffer = tempBuffer.slice(headerPacket_size)
                }
            }

            let _cmd = _headerPacket.readUInt8(4)

            switch (_cmd) {
                case 0: //wellcome
                    console.log('welcome')
                    break;
                case 0x01: //upload image
                    {
                        _currentBank = _headerPacket.readUInt8(5)
                        const _imgType = _headerPacket.readUInt8(6)
                        _uploadSize = _headerPacket.readUInt32LE(8)

                        imageBuffer[_currentBank] = {
                            type: _imgType
                        }

                        if(tempBuffer) {
                            _uploadSize -= tempBuffer.length
                            
                            if (_uploadSize <= 0) {
                                
                                imageBuffer[_currentBank].data = tempBuffer.slice(0, _uploadSize)
                                tempBuffer = tempBuffer.slice(_uploadSize)
                                data_handler = _processPacketBase
                            }
                            else {
                                data_handler = _processUploadPacket
                            }
                        }
                        else {
                            data_handler = _processUploadPacket
                        }
                    }
                    break;
                case 0x02: //download image
                    {
                        const _bank_index = _packet.readUInt8(5)
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)
                        res_packet.writeUInt8(_bank_index, 5)
                        // res_packet.writeUInt8(0, 6)
                        // res_packet.writeUInt8(0, 7)

                        if (imageBuffer[_bank_index]) {

                            // console.log(`${_bank_index}'s length : ${imageBuffer[_bank_index].data.length}`)
                            const _img = imageBuffer[_bank_index]
                            res_packet.writeUInt8( _img.type, 6)
                            res_packet.writeUInt32LE( _img.data.length, 8)

                            client_socket.write(Buffer.concat([res_packet, _img.data]))
                        }
                        else {
                            res_packet.writeUInt32LE(0, 8)
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
                case 0x99://close
                    {
                        console.log('close')

                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)

                        client_socket.write(res_packet)

                        client_socket.end()
                    }
                    break;
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
            let _welcome = Buffer.alloc(headerPacket_size)
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
        // getBuffer, 
        // setBuffer,
        server_socket,
        getBufferList: () => {

            let _list = []

            for (let i = 0; i < imageBuffer.length; i++) {
                if (imageBuffer[i])
                    _list.push({
                        index: i,
                        size: imageBuffer[i].data.length,
                        type : imageBuffer[i].type
                    })
            }

            return _list
        }
    }
}


