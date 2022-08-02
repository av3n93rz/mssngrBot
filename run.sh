#!/bin/sh
while true; do
    node bot.js
    [ $? -ne 137 ] && break
done
