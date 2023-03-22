// import net from 'net'

const dgram = require("dgram");

const packet_checkCode = 20221223
const headerPacket_size = 32

const subcribers = []

export default async function ({ port, context }) {

    const imageBuffer = context.imageBuffer.buffer

    const packet_checkCode = context.packet_checkCode

    const server_socket = dgram.createSocket("udp4");

    server_socket.on("message", function (msg, rinfo) {

        const _checkcode = msg.readUInt32LE(0)
        const _cmd = msg.readUInt8(4)

        if (_checkcode != packet_checkCode) return;

        switch (_cmd) {
            case 0: //header
                {
                    console.log('ping test')
                    let res_packet = Buffer.alloc(headerPacket_size)
                    res_packet.writeUInt32LE(packet_checkCode, 0)
                    res_packet.writeUInt8(_cmd, 4)

                    server_socket.send(res_packet, rinfo.port, rinfo.address, (err) => {
                        if (err) {
                            console.log(`server error:\n${err.stack}`);
                            // server_socket.close();
                        }
                    });
                }
                break;
            case 0x01: //upload
                {
                    const _encode_type = msg.readUInt8(5) // 1:jpg, 2:png
                    const _bank_id = msg.readUInt8(6)
                    const _index = msg.readUInt8(7)

                    const _scp = subcribers[_bank_id]
                    if (_scp) {
                        server_socket.send(msg, _scp.rinfo.port, _scp.rinfo.address)
                    }
                    else {
                        if (imageBuffer[_bank_id] == undefined) {
                            imageBuffer[_bank_id] = {
                                data: [],
                                encode_type: _encode_type,
                                type: 100
                            }
                        }
                        const _data = msg.subarray(headerPacket_size, msg.length)
                        // console.log(_data.length)

                        if (_checkcode == packet_checkCode) {
                            imageBuffer[_bank_id].data[_index] = _data
                        }

                    }


                }
                break;
            case 0x02: //download
                {
                    const _bank_id = msg.readUInt8(5)
                    const _index = msg.readUInt8(6)

                    let res_packet = Buffer.alloc(headerPacket_size)
                    const _data = imageBuffer[_bank_id].data[_index]

                    if (_data == undefined) {
                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 0x02)
                        res_packet.writeUInt8(0x00, 0x03)
                        server_socket.send(res_packet, rinfo.port, rinfo.address, (err) => {
                            if (err) {
                                console.log(`server error:\n${err.stack}`);
                            }
                        });
                        return
                    }
                    else {

                        res_packet.writeUInt32LE(packet_checkCode, 0)
                        res_packet.writeUInt8(_cmd, 0x02)
                        res_packet.writeUInt8(0x01, 0x03)
                        res_packet.writeUInt8(imageBuffer[_bank_id].type, 0x04)
                        // res_packet.writeUInt8(imageBuffer[_bank_id].data.length, 0x05)
                        server_socket.send(Buffer.concat([res_packet, _data]), rinfo.port, rinfo.address, (err) => {
                            if (err) {
                                console.log(`server error:\n${err.stack}`);
                            }
                        });
                    }

                }
                break;
            case 0x10: //add subcriber
                {
                    const _bank_id = msg.readUInt8(5)
                    // const _index = msg.readUInt8(5)

                    if (subcribers[_bank_id] == undefined) {
                        subcribers[_bank_id] = {
                            rinfo: rinfo
                        }
                        console.log(`add subcriber ${rinfo.address}:${rinfo.port} bank_id : ${_bank_id} `);
                    }
                    else {
                        console.log(`update subcriber ${rinfo.address}:${rinfo.port} bank_id : ${_bank_id} `);
                        subcribers[_bank_id].rinfo = rinfo
                    }   
                }
                break;
        }
        // console.log(`received ${msg.length} bytes from ${rinfo.address}:${rinfo.port} bank_id : ${_bank_id} index : ${_index} checkcode : ${_checkcode} `);

    });

    server_socket.bind(port);

    console.log('img mirror UDP Server listening on ' + ':' + port);

    return {
        server_socket,
        getSubbcribers: function () {
            return subcribers
        }
    }
}


