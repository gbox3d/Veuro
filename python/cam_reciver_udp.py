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

import threading

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
_checkcode = 20221223
udp_client = veroUdpClient(remoteIP,remotePort,_checkcode,buff_size,
    bankId=bankId,timeout=1)
#%%
udp_client.subscribe()
# %%
while True :
    _data, rinfo = udp_client.client_socket.recvfrom(buff_size)
    print(f'get data from {rinfo} : {len(_data)}')
    

# %%
