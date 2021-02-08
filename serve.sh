#!/bin/bash

IP=$1
if [ "$IP" = "" ]
then
  IP=127.0.0.1
fi

npx http-server -p 5555 -a $IP -P https://babel.hathitrust.org
