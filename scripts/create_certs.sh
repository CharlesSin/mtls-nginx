#!/usr/bin/env bash

PROJECT_NAME="Eugene SSL/TLS"

# Generate the openssl configuration files.
cat > ca_cert.conf << EOF
[ req ]
distinguished_name     = req_distinguished_name
prompt                 = no
[ req_distinguished_name ]
 O                      = $PROJECT_NAME Certificate Authority
EOF

cat > server_cert.conf << EOF
[ req ]
distinguished_name     = req_distinguished_name
prompt                 = no
[ req_distinguished_name ]
 O                      = $PROJECT_NAME
 CN                     = localhost
EOF

cat > client_cert.conf << EOF
[ req ]
distinguished_name     = req_distinguished_name
prompt                 = no
[ req_distinguished_name ]
 O                      = $PROJECT_NAME Device Certificate
 CN                     = localhost
EOF

mkdir ca
mkdir server
mkdir client
mkdir certDER

# private key generation
openssl genrsa -out ca.key 2048
openssl genrsa -out server.key 2048
openssl genrsa -out client.key 2048

# cert requests
openssl req -out ca.req -key ca.key -new \
            -config ./ca_cert.conf
openssl req -out server.req -key server.key -new \
            -config ./server_cert.conf
openssl req -out client.req -key client.key -new \
            -config ./client_cert.conf

# generate the actual certs.
openssl x509 -req -in ca.req -out ca.crt \
            -sha256 -days 500 -signkey ca.key
openssl x509 -req -in server.req -out server.crt \
            -sha256 -CAcreateserial -days 500 \
            -CA ca.crt -CAkey ca.key
openssl x509 -req -in client.req -out client.crt \
            -sha256 -CAcreateserial -days 500 \
            -CA ca.crt -CAkey ca.key

openssl x509 -in ca.crt -outform DER -out ca.der
openssl x509 -in server.crt -outform DER -out server.der
openssl x509 -in client.crt -outform DER -out client.der

mv ca.crt ca.key ca/
mv server.crt server.key server/
mv client.crt client.key client/

mv ca.der server.der client.der certDER/

rm *.conf
rm *.req
rm *.srl