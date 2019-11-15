#!/usr/bin/env bash

ENV_FILE=$(dirname "$0")/.env
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

if [ -z "$NEO4J_USERNAME" ] || [ -z "$NEO4J_PASSWORD" ]; then
  echo "Please set NEO4J_USERNAME and NEO4J_PASSWORD environment variables."
  echo "Database manipulation is not possible without connecting to the database."
  echo "E.g. you could \`cp .env.template .env\` unless you run the script in a docker container"
fi

until echo 'RETURN "Connection successful" as info;' | cypher-shell
do
  echo "Connecting to neo4j failed, trying again..."
  sleep 1
done

echo "
// convert old DISABLED to new REVIEWED-Case-FLAGGED structure
MATCH (moderator:User)-[disabled:DISABLED]->(disabledResource)
WHERE disabledResource:User OR disabledResource:Comment OR disabledResource:Post
DELETE disabled
CREATE (moderator)-[review:REVIEWED]->(case:Case)-[:FLAGGED]->(disabledResource)
SET review.updatedAt = toString(datetime()), review.createdAt = review.updatedAt, review.disable = true
SET case.id = randomUUID(), case.updatedAt = toString(datetime()), case.createdAt = case.updatedAt, case.disable = true, case.closed = false

// if disabledResource has no report, then create a moderators default report
WITH moderator, disabledResource, case
//, review
//OPTIONAL MATCH (noReporterDisabledResource:User)-[:REPORTED]->(disabledResource)
//WHERE noReporterDisabledResource IS NULL
//OPTIONAL MATCH (:User)-[notExistingReport:REPORTED]->(disabledResource)
//WHERE notExistingReport IS NULL
OPTIONAL MATCH (noReporterDisabledResource:User)-[notExistingReport:REPORTED]->(disabledResource)
WHERE NOT (noReporterDisabledResource)-[notExistingReport]->(disabledResource)
CREATE (moderator)-[addModeratorReport:REPORTED]->(case)
SET addModeratorReport.createdAt = toString(datetime()), addModeratorReport.reasonCategory = 'other', addModeratorReport.reasonDescription = 'Old DISABLED relation had no now mandatory report !!! Created automatically to ensure database consistency! Creation date is when the database manipulation happened.'

// if disabledResource has reports, then convert them
WITH disabledResource, case
//, review
MATCH (reporterDisabledResource:User)-[existingReport:REPORTED]->(disabledResource)
DELETE existingReport
CREATE (reporterDisabledResource)-[reportDisabledResource:REPORTED]->(case)
SET reportDisabledResource = existingReport

// for REPORTED resources without DISABLED relation which are handled above, create new REPORTED-Case-FLAGGED structure
WITH
MATCH (reporter:User)-[oldReport:REPORTED]->(noDisabledResource)
WHERE noDisabledResource:User OR noDisabledResource:Comment OR noDisabledResource:Post
DELETE oldReport
CREATE (reporter)-[report:REPORTED]->(case:Case)
MERGE (case)-[:FLAGGED]->(noDisabledResource)
SET report = oldReport
SET case.id = randomUUID(), case.updatedAt = toString(datetime()), case.createdAt = case.updatedAt, case.disable = false, case.closed = false

RETURN disabledResource, noDisabledResource, review, report, addModeratorReport;
" | cypher-shell
