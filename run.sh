#!/bin/sh
while true; do
    npm run build && npm run start
    [ $? -ne 137 ] && break
done
