#%%
from collections.abc import Callable, Iterable, Mapping
from typing import Any
import cv2 as cv
from ultralytics import YOLO,checks
import time
import threading
from struct import *

from IPython.display import display
import PIL.ImageFont as ImageFont
import PIL.ImageDraw as ImageDraw
import PIL.ImageColor as ImageColor
import PIL.Image as Image

import yaml

from dariusVision import getCameraClass,getVersion

print(checks())

#%%
print(f'dariusVision version: {getVersion()}')
print(f'cv version: {cv.__version__}')


#%%
config_file = 'sample.config.yaml'
with open( config_file, 'r') as f:
    config_data = yaml.load(f,Loader=yaml.FullLoader)['aicam_detect']
    print(config_data)
    
#%%
class detectionLoopThread(threading.Thread):
    
    def __init__(self, model, cam, conf=0.5, verbose=False):
        super().__init__()
        self.model = model
        self.cam = cam
        self.conf = conf
        self.verbose = verbose
        self._stop_event = threading.Event() #쓰레드 정지용 이벤트 변수 초기화
        self.result = None
        self.frame = None
        self.fps = 0
        
    def stop(self):
        self._stop_event.set()
        self.fps = 0
        
    def stopped(self):
        return self._stop_event.is_set()
    
    def run(self):
        prev_time = time.time()  # Initialize the previous time
        while not self.stopped():
            _,frame = self.cam.getFrame()
            results = self.model(source=frame, conf=self.conf,verbose=self.verbose)
            if len(results) > 0:
                result = results[0]                
                
                # print('img size:',result.orig_shape)
                boxes = result.boxes
                # print(f'detection boxes: {len(boxes)}')
                
                #pack header
                _resultBuf = pack('<HHH',
                                  result.orig_shape[1],
                                  result.orig_shape[0],
                                  len(boxes)
                                  ) 
                #make 8 byte align
                _resultBuf += b'\x00' * (8 - len(_resultBuf) % 8)
                
                #pack body
                for box in boxes:
                    _xyxy = box.xyxy.cpu().detach().numpy()
                    _resultBuf += pack('<HHLLLL',
                                       int(box.cls.cpu().detach().item()),
                                       int(box.conf.cpu().detach().item()*100),
                                       int(_xyxy[0][0]),
                                       int(_xyxy[0][1]),
                                       int(_xyxy[0][2]),
                                       int(_xyxy[0][3]),
                                       )
                    self.result = _resultBuf
            self.frame = frame     
            time.sleep(0.01) # 10ms
            # Calculate FPS
            curr_time = time.time()
            fps = 1.0 / (curr_time - prev_time)  # FPS is the reciprocal of the time difference
            self.fps = fps
            prev_time = curr_time

# %%
model = YOLO(config_data['model'])
print(model.names)

#%%
lcam = getCameraClass(type=config_data['camType'])(vid_src=config_data['vidSrc'])   
lcam.startCamera()

#%% start detection thread
_detectionThread = detectionLoopThread(model,lcam,conf=config_data['conf'])
_detectionThread.start()

#%%
while True:
    print('Menu:')
    print('0. Exit')
    print('1. Show last detected frame')
    print('2. Show last detection result')
    print('3. Stop detection')
    print('4. Start detection')
    print('5. Get fps' )
    # You can add more options as you wish
    choice = input('Choose an action: ')
    
    if choice == '0':
        
        # Stop detection thread before exiting
        _detectionThread.stop()
        _detectionThread.join()  # Wait until thread finishes
        break
    elif choice == '1':
        # Assuming that `self.frame` in `detectionLoopThread` is the last frame processed
        cv.imshow('Last Frame', _detectionThread.frame)
        cv.waitKey(0)  # Wait until any key is pressed
    elif choice == '2':
        # Assuming that `self.result` in `detectionLoopThread` is the last detection result
        print(_detectionThread.result)
    elif choice == '3':
        _detectionThread.stop()
    elif choice == '4':
        if _detectionThread.stopped():
            _detectionThread = detectionLoopThread(model, lcam, conf=config_data['conf'])
            _detectionThread.start()
    elif choice == '5': #get fps
        print(f'fps: {_detectionThread.fps}')
    else:
        print('Invalid choice')

lcam.stopCamera()  # Stop camera before exiting
