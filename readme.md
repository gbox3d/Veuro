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