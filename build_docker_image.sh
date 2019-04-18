#!/bin/sh
#rm tmb_ekyc_node_$1.tar.gz
echo build tmb/ekyc_node_$1
docker build -t tmb/ekyc_node_$1 .
#docker save tmb/ekyc_node | gzip -v > tmb_ekyc_node.tar.gz
echo packing image to .tar.gz
docker save tmb/ekyc_node_$1 -o tmb_ekyc_node_$1.tar.gz
echo remove none tag
docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
