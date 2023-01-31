#%%
import socket
import yaml
import struct
import cv2 as cv
from struct import *
import time
import io
from PIL import Image, ImageDraw, ImageFont
from IPython.display import display

# %%
class veroTcpClient:
    def __init__(self,ip,port,checkcode=20221223,buff_size=1024,bankId=0,timeout=1) :
        self.ip = ip
        self.port = port
        self.buff_size = buff_size
        self.checkcode = checkcode
        self.bankId = bankId
        self.timeout = timeout
    def connect(self) :
        try :
            self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.client_socket.connect((self.ip, self.port))
            self.client_socket.settimeout(1)
            print('connected ok')
            
            _result = self.client_socket.recv(1024)
            _code,_cmd = struct.unpack('<LB', _result[:5])
            print(f'code : {_code}, cmd : {_cmd}')
            
        except Exception as ex:
            print(f'error : {ex}')
    def send_ping(self) :
        _packpack = struct.pack('<LB', self.checkcode,0x10)
        _packpack += bytearray(27) #padding
        self.client_socket.sendall(_packpack)
        
        _result = self.client_socket.recv(self.buff_size)
        _code,_cmd = struct.unpack('<LB', _result[:5])
        print(f'code : {_code}, cmd : {_cmd}')
        
    def send_data(self,data) :
        _data = data
        _header = struct.pack('<LBBBBL', self.checkcode,0x01,self.bankId,
                              0x02, # 0x01 : jpg , 0x02 : png , 0x03 : raw
                              0,len(_data))
        _header += bytearray(20) #padding 12+20 = 32
        self.client_socket.sendall(_header)
        self.client_socket.sendall(_data)
        
        print('send data ok')
        
    def download(self) :
        
        _header = struct.pack('<LBB', self.checkcode,0x02,self.bankId)
        _header += bytearray(26) #padding 12+20 = 32
        self.client_socket.sendall(_header)
        
        
        _result = self.client_socket.recv(self.buff_size)
        
        #read header
        _code,_cmd,_,_,_,buff_size = struct.unpack('<LBBBBL', _result[0:12])
        print(f'code : {_code}, cmd : {_cmd} , buff_size : {buff_size}')
        
        #read data
        _data = _result[32:]
        while len(_data) < buff_size :
            _data += self.client_socket.recv(self.buff_size)
        
        display(Image.open(io.BytesIO(_data)))
        
        
    def close(self) :
        _packpack = struct.pack('<LB', self.checkcode,0x99)
        _packpack += bytearray(27) #padding
        self.client_socket.sendall(_packpack)
        
        _result = self.client_socket.recv(self.buff_size)
        _code,_cmd = struct.unpack('<LB', _result[:5])
        print(f'code : {_code}, cmd : {_cmd}')
        self.client_socket.close()
#%%
class veroUdpClient:
    def __init__(self,ip,port,checkcode=20221223,buff_size=1024,bankId=0,timeout=1) :
        self.ip = ip
        self.port = port
        self.buff_size = buff_size
        self.checkcode = checkcode
        self.bankId = bankId
        self.timeout = timeout
        self.imgsize = (640,480) 
        self.division = (4,4)
        self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # def connect(self) :
        
    def send_ping(self) :
        _packpack = struct.pack('<LB', self.checkcode,0x00)
        _packpack += bytearray(27)
        self.client_socket.sendto(_packpack,(self.ip,self.port))
    
    def send_data(self,frame) :
        
        _index = 0
        _mx = int(self.imgsize[0] / self.division[0])
        _my = int(self.imgsize[1] / self.division[1])
        for _y in range(0, self.division[1]):
            for _x in range(0, self.division[0]):
                _frame = frame[(_my*_y):(_my*(_y+1)),(_mx*_x):(_mx*(_x+1))]
                _,_encodee_img = cv.imencode('.png',_frame)
                _header = struct.pack('<LBBBB',self.checkcode,0x01,0x02,self.bankId,_index)
                _header += bytearray(24) #padding 32-8 = 24
                
                self.client_socket.sendto( _header + _encodee_img.tobytes() ,(self.ip,self.port))
                _index += 1
                time.sleep(0.001)
                
    def subscribe(self) : 
        _packpack = struct.pack('<LBB', self.checkcode,0x10,self.bankId)
        _packpack += bytearray(26) #padding
        self.client_socket.sendto(_packpack,(self.ip,self.port))
    def unSubscribe(self) : 
        _packpack = struct.pack('<LBB', self.checkcode,0x11,self.bankId)
        _packpack += bytearray(26) #padding
        self.client_socket.sendto(_packpack,(self.ip,self.port))
        
    
    
    
#%%
if __name__ == '__main__' :
    with open('config.yaml', 'r') as f:
        
        config_data = yaml.load(f,Loader=yaml.FullLoader)
        
        print(config_data)
        server_ip = config_data['server_ip']
        tcp_port = config_data['tcp_port']
        udp_port = config_data['udp_port']
        buff_size = config_data['buff_size']
        bankId = config_data['bankId']
        source = config_data['source']
        height = config_data['height']
        width = config_data['width']
        
        _checkcode = 20221223
        
        tcp_client = veroTcpClient(server_ip,tcp_port,_checkcode,buff_size,
                                bankId=bankId,timeout=1)
        udp_client = veroUdpClient(server_ip,udp_port,_checkcode,buff_size,
                                    bankId=bankId,timeout=1)
        
        lcam = cv.VideoCapture(int(source))
        lcam.set(cv.CAP_PROP_FRAME_WIDTH, width)
        lcam.set(cv.CAP_PROP_FRAME_HEIGHT, height)
                                    
        
        
        # _sender = veroTcpClient(server_ip,port,checkcode,buff_size,
        #                         bankId=bankId,timeout=1)
        # _udpClient = veroUdpClient(server_ip,port,checkcode,buff_size,
        #                        bankId=bankId,timeout=1)
                            
    while True :
        _cmd = input('cmd : ')
        try :
            if _cmd == 'ping' :
                tcp_client.send_ping()
            elif _cmd == 'connect' :
                tcp_client.connect()
            elif _cmd == 'close' :
                tcp_client.close()
                break
            elif _cmd == 'test1' :
                tcp_client.connect()
                tcp_client.send_ping()
                with open('test.png', 'rb') as f:
                    _data = f.read()
                    tcp_client.send_data(_data)
                tcp_client.close()
            elif _cmd == 'test2' :
                tcp_client.connect()
                tcp_client.send_ping()
                tcp_client.download()
                tcp_client.close()
            elif _cmd == 'sendframe' :
                ret ,frame = lcam.read()
                udp_client.send_data(frame)
            elif _cmd == 'udpping' :
                udp_client.send_ping()
                _data,_rinfo = udp_client.client_socket.recvfrom(1024)
                checkcode,_cmd = unpack(b'<LB',_data[0:5])
                if _cmd == 0x00 :
                    print(f'pong ok , remoteip : {_rinfo[0]} , remoteport : {_rinfo[1]}')
            elif _cmd == 'subscribe' :
                udp_client.subscribe()
            elif _cmd == 'unSubscribe' :
                udp_client.unSubscribe()
            elif _cmd == 'exit' :
                break
            print(f'{_cmd} command ok')
        except Exception as ex :
            print(f'error : {ex}')
            
    lcam.release()
        
# %%