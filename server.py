#%%
from email import header
import os
from select import select
import socket
import io
from struct import *
import time
import json
import yaml

import time
from PIL import Image, ImageDraw, ImageFont
from IPython.display import display

# import sys
import numpy as np
import torch
import cv2 as cv

from net_tools import TcpSimpleImgProcServer

appVersion = [0,0,1]
print(f'start app version {appVersion}')


#%%
# print(f'config file : {config_file}')

try:
    with open('config.yaml', 'r') as f:
        
        config_data = yaml.load(f,Loader=yaml.FullLoader)
        
        print(config_data)
        port = config_data['port']
        debug = config_data['debug']
        buff_size = config_data['buff_size']

        _server = TcpSimpleImgProcServer('', port,buff_size=1024,debug_log=debug)
        # _server.buff_size = 1024
        # _server.debug_log = debug_log
        _server.start()
        
    print('complete')
    
except  Exception as ex:   
    print(f'error : {ex}')
    print(type(ex))
    print(ex.args)
    
    config_data = None 
    
print(f'application terminated')
# %%
