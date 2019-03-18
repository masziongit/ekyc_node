#nohup /home/appusr/cli/node-v8.9.1-linux-x64/bin/node app.js > nohup.out 2> nohup.err < /dev/null &
docker run --rm --name ekyc_node_$1 --env-file env -p 8080:8080 tmb/ekyc_node_$1

