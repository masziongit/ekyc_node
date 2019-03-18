DB_USER=c##testsc \
DB_PASSWORD=37459a8b1070bac37fcce3724eeca9d4 \
DB_CONNECT_STRING=192.168.99.102/xe \
BMS_HOST=http://172.24.217.20:3000/BMSWebservice72/BMS_WebService.asmx \
BIODETECT=http://hk-xface-stg.pingan.com.cn:130/bioauth/api11/biodetect \
FACE_DETECT=http://hk-xface-int-stg.pingan.com/bioauth/api01/face/detect \
FACE_COMPARE=http://hk-xface-int-stg.pingan.com/bioauth/api01/face/compare \
SIGNATURE=bioauthB74908CD6BDF4789802192C26931D308 \
LOG_LEVEL=debug \
SEVER_CA=./certs/tmb-root-ca.cer \
SEVER_CERT=./certs/ekyc.cer \
SEVER_KEY=./certs/ekyc.key \
npm run dev;