#%%
import socket
import yaml
import struct

import io
from PIL import Image, ImageDraw, ImageFont
from IPython.display import display


checkcode = 20221223

#%%
with open('config.yaml', 'r') as f:
        
    config_data = yaml.load(f,Loader=yaml.FullLoader)
    
    print(config_data)
    port = config_data['port']
    remoteHost = config_data['remoteHost']
    buff_size = config_data['buff_size']


# %%
class testerClass:
    def __init__(self,ip,port,buff_size) :
        self.ip = ip
        self.port = port
        self.buff_size = buff_size
    def connect(self) :
        try :
            self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.client_socket.connect((self.ip, self.port))
            self.client_socket.settimeout(1)
            print('connected ok')
            
            _result = self.client_socket.recv(self.buff_size)
            _code,_cmd = struct.unpack('<LB', _result[:5])
            
            print(f'code : {_code}, cmd : {_cmd}')
            
        except Exception as ex:
            print(f'error : {ex}')
    def send_ping(self) :
        _packpack = struct.pack('<LB', checkcode,0x10)
        _packpack += bytearray(27)
        self.client_socket.sendall(_packpack)
        _result = self.client_socket.recv(self.buff_size)
        # _code,_cmd,_,_,_ = struct.unpack('<LBBBB', _result)
        # _code,_cmd,_,_,_,_,_,_,_,_,_,_, = struct.unpack('<LBBBB6L', _result)
        _code,_cmd = struct.unpack('<LB', _result[:5])
        print(f'code : {_code}, cmd : {_cmd}')
    def send_data(self) :
        with open('asakura.jpg', 'rb') as f:
            _data = f.read()
            _header = struct.pack('<L4BL', checkcode,0x01,0,0,0,len(_data))
            _header += bytearray(20)
            
            self.client_socket.sendall(_header)
            self.client_socket.sendall(_data)
            
        _result = self.client_socket.recv(1024)
        _code,_cmd,_,_,_,buff_size = struct.unpack('<LBBBBL', _result)
        
        print(f'code : {_code}, cmd : {_cmd} , buff_size : {buff_size}')
    def download(self) :
        
        _header = struct.pack('<L4B', checkcode,0x02,0,0,0)
        _header += bytearray(24)
        
        
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
        _packpack = struct.pack('<L4B', checkcode,0x99,0,0,0)
        _packpack += bytearray(24)
        self.client_socket.sendall(_packpack)
        _result = self.client_socket.recv(self.buff_size)
        _code,_cmd = struct.unpack('<LB', _result[:5])
        print(f'code : {_code}, cmd : {_cmd}')
        self.client_socket.close()
print('init ok')
#%%
if __name__ == '__main__' :
    _sender = testerClass(remoteHost,port,buff_size)
    
    
    while True :
        _cmd = input('cmd : ')
        try :
            if _cmd == 'ping' :
                _sender.send_ping()
            elif _cmd == 'connect' :
                _sender.connect()
            elif _cmd == 'close' :
                _sender.close()
                break
            elif _cmd == 'test1' :
                _sender.connect()
                _sender.send_ping()
                _sender.send_data()
                _sender.close()
            elif _cmd == 'test2' :
                _sender.connect()
                _sender.send_ping()
                _sender.download()
                _sender.close()

            elif _cmd == 'exit' :
                break
            print(f'{_cmd} command ok')
        except Exception as ex :
            print(f'error : {ex}')
        
# %%