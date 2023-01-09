# Vision system for neuro AI

## Overview

data flow:  

camera -> sender app ->  server -> receiver app -> display  

## Installation

## packet

checkcode(4) : 20221223  
bankId(5) : 0~255  
imgtype(6) : 1 = jpg, 2 = png, 3 = bmp  

## buffer format
type : 1 = jpg, 2 = png, 3 = bmp , 4 = mozaic  
data : image data  
mozaic_data : [..., {x, y, w,h,png_data}, ...]  
## kill process port

```bash
sudo lsof -i :21050 # find process id
sudo kill -9 12345 # kill process


fuser -k 21050/tcp

```


## reference

이미지 인코딩/디코딩 모듈  
https://www.npmjs.com/package/image-encode  

## TODO
udp 처리  
