#!/bin/bash
/usr/bin/time -f "%e %M" -o /sandbox/stats.txt \
  timeout ${TIME_LIMIT} sh -c "cd /sandbox && python3 main.py < input.txt > output.txt"
echo $? > /sandbox/exitcode.txt