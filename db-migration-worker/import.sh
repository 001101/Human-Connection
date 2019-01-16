#!/bin/bash

for var in "SSH_USERNAME" "SSH_HOST" "MONGODB_USERNAME" "MONGODB_PASSWORD" "MONGODB_DATABASE" "NEO4J_USERNAME" "NEO4J_PASSWORD" "MONGODB_AUTH_DB"
do
  if [[ -z "${!var}" ]]; then
    echo "${var} is undefined"
    exit -1
  fi
done

OUTPUT_FILE_NAME=${OUTPUT_FILE_NAME:-human-connection-dump}.archive

echo "SSH_USERNAME             ${SSH_USERNAME}"
echo "SSH_HOST                 ${SSH_HOST}"
echo "MONGODB_USERNAME         ${MONGODB_USERNAME}"
echo "MONGODB_PASSWORD         ${MONGODB_PASSWORD}"
echo "MONGODB_DATABASE         ${MONGODB_DATABASE}"
echo "MONGODB_AUTH_DB          ${MONGODB_AUTH_DB}"
echo "NEO4J_USERNAME           ${NEO4J_USERNAME}"
echo "NEO4J_PASSWORD           ${NEO4J_PASSWORD}"
echo "-------------------------------------------------"

ssh -4 -M -S my-ctrl-socket -fnNT -L 27018:localhost:27017 -l ${SSH_USERNAME} ${SSH_HOST}
mongodump --host localhost -d ${MONGODB_DATABASE} --port 27018 --username ${MONGODB_USERNAME} --password ${MONGODB_PASSWORD} --authenticationDatabase ${MONGODB_AUTH_DB} --gzip --archive=${OUTPUT_FILE_NAME}
ssh -S my-ctrl-socket -O check -l ${SSH_USERNAME} ${SSH_HOST}
ssh -S my-ctrl-socket -O exit  -l ${SSH_USERNAME} ${SSH_HOST}

mongorestore --gzip --archive=human-connection-dump.archive
# cat ./neo4j_import.cql | /usr/share/neo4j/bin/cypher-shell



