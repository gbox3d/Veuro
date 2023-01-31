#%%
import socket
import io
import struct

import json
from turtle import width
import yaml
import torch

import cv2 as cv 
import sys
import time 
import numpy as np
import datetime
import os

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from IPython.display import display

from modules.etc import isnotebook
from veuroClientLib import veroUdpClient

#%%
with open( 'config.yaml' , 'r') as f:
    config_data = yaml.load(f,Loader=yaml.FullLoader)
    print(config_data)
    remoteIP = config_data['server_ip']
    remotePort = config_data['udp_port']
    source = config_data['source']
    height = config_data['height']
    width = config_data['width']
    bankId = config_data['bankId']
    buff_size = config_data['buff_size']
    

#%%
lcam = None
if source.isnumeric() :
    # lcam = lastest_Cam2(vid_src=int(source),width=width,height=height,grab_delay=0.02)
    lcam = cv.VideoCapture(int(source))
    lcam.set(cv.CAP_PROP_FRAME_WIDTH, width)
    lcam.set(cv.CAP_PROP_FRAME_HEIGHT, height)
    print(f'cam {source} open  {width}x{height} fps : {lcam.get(cv.CAP_PROP_FPS)} ')
else:
    lcam = cv.VideoCapture(source)
    print(f'{source} open ')

#%%
try :
    
    checkcode = 20221223
    # sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    udp_client = veroUdpClient(remoteIP,remotePort,checkcode,buff_size,
                                    bankId=bankId,timeout=1)
    
    time.sleep(1)
    print('start send data')
    capture_counter = 0
    # div_size = 4
    
    while True:
        try :
            
            # startTime = time.time()
            
            if source.isnumeric() :
                ret ,frame = lcam.read()
            else :
                frame = cv.imread(source)
                ret = True
            capture_counter += 1    
            
            udp_client.send_data(frame)
            # time.sleep(0.02)
            
            # _index = 0
            # _mx = int(width/ div_size)
            # _my = int(height / div_size) 
            # for _y in range(0, div_size):
            #     for _x in range(0,div_size):
            #         _frame = frame[(_my*_y):(_my*(_y+1)),(_mx*_x):(_mx*(_x+1))]
            #         # _frame = frame[0:80,0:60]
            #         # print(f'frame size : {_frame.shape} , {_frame.dtype} , {_frame.nbytes} bytes')
            #         _,_encodee_img = cv.imencode('.png',_frame)
            #         # print(f'image size : {_encodee_img.shape} , {_encodee_img.dtype} , {_encodee_img.nbytes} bytes')
            #         # print(f' ({_x},{_y}) , reduce size rate : {_encodee_img.nbytes /_frame.nbytes * 100 :.2f} %')
                    
            #         _header = struct.pack('<LBBBB',checkcode,0x01,0,bankId,_index)
            #         # print(f'header size : {len(_header)} bytes')
            #         sock.sendto( _header + _encodee_img.tobytes() ,(remoteIP,remotePort))
            #         _index += 1
            
            if isnotebook() != True :
                cv.imshow('frame',frame)
                if cv.waitKey(1) == 27:
                    print('esc break')
                    break
            else :
                display(Image.fromarray( cv.cvtColor(frame, cv.COLOR_BGR2RGB) ))
                # time.sleep(1)
                # print(f'frame size : {frame.shape} , {frame.dtype} , {frame.nbytes} bytes')
            # display(Image.fromarray(frame))
                if capture_counter >= 1 :
                    break;
            
            # delay = time.time() - startTime
            # print(f'network delay : {delay} sec ')
            
            
        except Exception as ex:
            if type(ex) == socket.timeout :
                pass
            else :
                print(f'error : {ex}')
                time.sleep(1)
                break;
        
except Exception as ex:
    print(f'error : {ex}')
    # time.sleep(1)
    # exit()
except KeyboardInterrupt :
    print('exiting....')
    # time.sleep(1)

# senderObj.close()
# time.sleep(1)
lcam.release()
print('exit')
        
# %%
