#!/bin/bash
/usr/bin/time -f "%e %M" -o /sandbox/stats.txt \
  timeout ${TIME_LIMIT} sh -c "/sandbox/solution < /sandbox/input.txt > /sandbox/output.txt"
echo $? > /sandbox/exitcode.txt