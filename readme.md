# Vision system for neuro AI

## Overview

data flow:  

camera -> sender app ->  server -> receiver app -> display  

## Installation


## kill process port

```bash
sudo lsof -i :21050 # find process id
sudo kill -9 12345 # kill process


fuser -k 21050/tcp

```

## udp buffer size


osx udp 버퍼 늘리기  (default : 9216)
```bash
sudo sysctl -w net.inet.udp.maxdgram=65535
```





## reference

이미지 인코딩/디코딩 모듈  
https://www.npmjs.com/package/image-encode  

udp 통신
https://awakening95.tistory.com/1  

## TODO
udp 처리  
