// var net = require('net');
import fs from 'fs';
import net from 'net'

const packet_checkCode = 20221223
const headerPacket_size = 32
// const imageHeader_size = 32

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
    });



    const server_socket = net.createServer(async function (client_socket) {

        let _currentBank = -1;
        let _uploadSize = 0;
        let tempBuffer = null;

        let data_handler = _processPacketBase

        function _processUploadPacket(_packet) {

            if (_uploadSize > 0) {

                // tempBuffer = Buffer.concat([tempBuffer, _packet])

                if (tempBuffer) {
                    tempBuffer = Buffer.concat([tempBuffer, _packet])
                }
                else {
                    tempBuffer = _packet
                }

                _uploadSize -= _packet.length

                // console.log(_packet.length, _uploadSize)

                if (_uploadSize == 0) {
                    imageBuffer[_currentBank] = tempBuffer
                    tempBuffer = null
                    data_handler = _processPacketBase
                    // console.log('upload complete')

                    //save image
                    // fs.writeFileSync(`./image${_currentBank}.png`, imageBuffer[_currentBank])
                    
                    // let res_packet = Buffer.alloc(headerPacket_size + 4)
                    // res_packet.writeUInt32LE(packet_checkCode, 0)
                    // res_packet.writeUInt8(0x01, 4)
                    // res_packet.writeUInt8(_currentBank, 5)
                    // res_packet.writeUInt8(0, 6)
                    // res_packet.writeUInt8(0, 7)
                    // res_packet.writeUInt32LE(imageBuffer[_currentBank].length, 8)
                    // client_socket.write(res_packet)
                }
                else if(_uploadSize < 0) {
                    // console.log('error' , _uploadSize)

                    const _data_end = tempBuffer.length + _uploadSize
                    

                    tempBuffer.copy(imageBuffer[_currentBank], 0, 0, _data_end)
                    // tempBuffer = null

                    
                    let header_end = _data_end + imageHeader_size

                    if( header_end < tempBuffer.length ) {

                        let header_data = Buffer.alloc( imageHeader_size )
                        
                        tempBuffer.copy(header_data, 0, _data_end, header_end)

                        // tempBuffer = null

                        if (header_data.readUInt32LE(0) === packet_checkCode) {

                            const _cmd = header_data.readUInt8(4)
                            if (_cmd === 0x01) {
                                _currentBank = header_data.readUInt8(5)
                                _uploadSize = header_data.readUInt32LE(8)

                                const _extra_data = Buffer.alloc(tempBuffer.length - header_end)
                                tempBuffer.copy(_extra_data, 0, header_end)
                                _uploadSize -= _extra_data.length
                                tempBuffer = _extra_data

                                // console.log('extra data' , _extra_data.length, _uploadSize)
                            }
                            else {
                                data_handler = _processPacketBase
                                tempBuffer = null
                            }
                        }
                        else {
                            data_handler = _processPacketBase
                            tempBuffer = null
                            console.log('checkcode error'  )

                        }
                    }
                    else {

                        console.log('header not ready')
                        data_handler = _processPacketBase
                        const _extra_data = Buffer.alloc(tempBuffer.length - _data_end)
                        tempBuffer.copy(_extra_data, 0, _data_end)
                        
                    }

                }
            }

        }

        function _processPacketBase(_packet) {

            if(tempBuffer) {
                tempBuffer = Buffer.concat([tempBuffer, _packet])
            }
            else {
                tempBuffer = _packet
            }

            if (tempBuffer.length < headerPacket_size) {
                return
            }

            const _headerPacket = tempBuffer

            if(tempBuffer.length == headerPacket_size) {
                // _headerPacket = tempBuffer
                tempBuffer = null
            }
            else {
                tempBuffer = tempBuffer.slice(headerPacket_size)
            }

            // tempBuffer.slice(0, headerPacket_size)
            // const _header = Buffer.alloc(headerPacket_size)
            // tempBuffer.copy(_header, 0, 0, headerPacket_size)


            let _checkcode = _headerPacket.readUInt32LE(0)

            if (_checkcode !== packet_checkCode)
                return false

            let _cmd = _headerPacket.readUInt8(4)

            switch (_cmd) {
                case 0: //wellcome
                    console.log('welcome')
                    break;
                case 0x01: //upload image
                    {
                        // const _bank_index = _packet.readUInt8(5)
                        _currentBank = tempBuffer.readUInt8(5)
                        _uploadSize = tempBuffer.readUInt32LE(8)

                        // if( _packet.length > imageHeader_size ) {
                        //     const _extra_data = Buffer.alloc(_packet.length - imageHeader_size)
                        //     _packet.copy(_extra_data, 0, imageHeader_size)
                        //     _uploadSize -= _extra_data.length
                        //     tempBuffer = _extra_data
                        // }
                        // else {
                        //     tempBuffer = null
                        // }

                        data_handler = _processUploadPacket
                        // imageBuffer[_currentBank] = null
                    }
                    break;
                case 0x02: //download image
                    {
                        const _bank_index = _packet.readUInt8(5)
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)
                        res_packet.writeUInt8(_bank_index, 5)
                        res_packet.writeUInt8(0, 6)
                        res_packet.writeUInt8(0, 7)

                        if (imageBuffer[_bank_index]) {

                            console.log(`imageBuffer[${_bank_index}].length : ${imageBuffer[_bank_index].length}`)
                            res_packet.writeUInt32LE(imageBuffer[_bank_index].length, 8)

                            client_socket.write(Buffer.concat([res_packet, imageBuffer[_bank_index]]))
                        }
                        else {
                            res_packet.writeUInt32LE(0, 8)
                            client_socket.write(res_packet)
                        }

                        // if(tempBuffer.length > headerPacket_size) {
                        //     tempBuffer = tempBuffer.slice(headerPacket_size)
                        //     data_handler = _processPacketBase
                        // }
                        // else {
                        //     tempBuffer = null
                        // }

                    }
                    break;
                case 0x10: //ping
                    {
                        console.log('ping')
                        let res_packet = Buffer.alloc(headerPacket_size)

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 4)

                        client_socket.write(res_packet)

                        // console.log(tempBuffer.length)

                        // if(tempBuffer.length > headerPacket_size) {
                        //     tempBuffer = tempBuffer.slice(headerPacket_size)
                        //     data_handler = _processPacketBase
                        // }
                        // else {
                        //     tempBuffer = null
                        // }
                        
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
        getBuffer, setBuffer, getDetectedStatus,
        server_socket
    }
}

// export default {
//     setup, getBuffer,setBuffer,getDetectedStatus
// }
// export { setup, getBuffer,setBuffer,getDetectedStatus }
// export { getBuffer }




