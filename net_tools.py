#%%
import os
import socket
import threading
import io
from struct import *
import time
import json

import numpy as np

from PIL import Image, ImageDraw, ImageFont
from IPython.display import display

#%%

def _PacketHandler(client_socket,debug_log = True,buff_size = 1024,checkcode = 20221223,defalutImg = None) :
    
    host,port = client_socket.getpeername()
    print(f'client connected {host}:{port}')
    
    imgBuffer = defalutImg
    bLoop = True
    
    while bLoop :
        
        try:
    
            # print('wait data')
            
            header = client_socket.recv(1024) # header size 16
            #close client
            if len(header) == 0 :
                bLoop = False
                break;

            _checkcode,_cmd,_cmd_p1,_cmd_p2,_cmd_p3  = unpack('<LBBBB',header[:8])
            
            print(_checkcode,_cmd,_cmd_p1,_cmd_p2,_cmd_p3)

            if _checkcode == checkcode :

                if _cmd == 0x01 : #req upload image
                    _data_size,_conf_thres,_iou_thres  = unpack('<Lff',header[8:20])
                    _data = header[32:]
                    
                    if debug_log == True:
                        print( f'header check ok recv data {_data_size},{_conf_thres} ,{_iou_thres}')
                        print(f'{_data.__sizeof__()}')

                    #파이썬의 빈 바이트 버퍼 크기는 33이다.(실제 바이트 수에서 33을 더해준 값이다.)
                    while _data.__sizeof__() < _data_size + 33 :
                        l = client_socket.recv(buff_size)
                        _data += l
                    
                    imgBuffer = _data

                    if debug_log == True:
                        if _data.__sizeof__() - _data_size == 33 :
                            print('data recv complete')
                        else :
                            print('data recv error')
                    
                    _packet = pack('<LBBBBL',checkcode,_cmd,0,0,0,len(_data)) # 8 byte
                    client_socket.sendall(_packet)
                elif _cmd == 0x02 : #req download image
                    _packet = pack('<LBBBBL',checkcode,_cmd,0,0,0,len(imgBuffer)) # 8 byte
                    client_socket.sendall(_packet)
                    client_socket.sendall( imgBuffer )
                    # client_socket.sendall( imgBuffer )
                elif _cmd == 0x10:
                    print('process ping packet')
                    _packet = pack('<LBBBB',checkcode,0x10,0,0,0) # 8 byte
                    client_socket.sendall(_packet)
                elif _cmd == 0x99 : # req close 
                    _packet = pack('<LBBBB',checkcode,0x99,0,0,0) # 8 byte
                    client_socket.sendall(_packet)
                    bLoop = False
                    time.sleep(1)
            else :
                print('check code error close client',client_socket.getpeername())
                _packet = pack('<LBBBB',-1,0,0,0,0) # 8 byte
                client_socket.sendall(_packet)
                bLoop = False
                time.sleep(1)
        except Exception as ex:
            if type(ex) == socket.timeout :
                pass
                # print('timeout close client',client_socket.getpeername())
            elif type(ex) == ConnectionResetError :
                print('client closed',client_socket.getpeername())
                bLoop = False
                time.sleep(1)
            elif type(ex) == ConnectionAbortedError :
                print('client closed',client_socket.getpeername())
                bLoop = False
                time.sleep(1)
            else :
                print(ex)
                bLoop = False
                time.sleep(1)
                
            
        except KeyboardInterrupt:
            print('ctrl-c interrupt exit')
            time.sleep(1)
            bLoop = False
            # client_socket.close()
            # return False
    print('close client',client_socket.getpeername())
    client_socket.close()

class TcpSimpleImgProcServer :
    version=100
    checkcode = 20221223
    def __init__(self,ip,port,debug_log = True,buff_size = 1024) :
        self.ip = ip
        self.port = port
        # self.onRecvImage = onRecvImage
        
        self.debug_log = debug_log
        self.buff_size = buff_size
        
        try :
            with open('./asakura.jpg', 'rb') as f:
                self.defaultImg = f.read()
            # display(Image.open(io.BytesIO(_defaultImg)))

            server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            server_socket.bind((ip, port))
            server_socket.listen(5)  # 5 CONNECTION QUEUE
            
            self.server_socket = server_socket
            
            print(f'listen {ip}:{port}')
        
        except Exception as ex:
            print(ex)
        
    def start(self) :
        try :
            while True:
                #접속대기 
                print('wait connect')
                server_socket = self.server_socket
                client_socket, _ = server_socket.accept()
                client_socket.settimeout(5) # 5 sec 간 응답없으면 연결 끊기
                
                #connetion thread start
                t = threading.Thread(target=_PacketHandler, args=(client_socket,self.debug_log,self.buff_size,self.checkcode,self.defaultImg))
                t.daemon = True
                t.start()
                
                # if self.procPacket() == False :
                    # break
        except Exception as ex:
            print(f'error : {ex}')
            time.sleep(1)
            # exit()
        except KeyboardInterrupt :
            print('exiting....')
            time.sleep(1)
        finally :
            print('closing server socket')
            self.server_socket.close()
            time.sleep(1)
            
        
#%%    
if __name__ == "__main__":
    _server = TcpSimpleImgProcServer("",26031,None,False,1024)
    _server.start()
    print('exit server')