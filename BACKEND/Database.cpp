#include "Database.h"
#include <string>
#include <cstdlib>
#include <ctime>
#include <cstdlib>
Database::Database()
{
conn = nullptr;
}

Database::~Database()
{
disconnect();
}

bool Database::connect()
{
conn = PQconnectdb(
"host=localhost port=5432 dbname=garudaresq user=postgres"
);

if (PQstatus(conn) == CONNECTION_OK)
{
    std::cout << "\nDatabase Connected Successfully!\n";
    return true;
}

std::cout << "\nDatabase Connection Failed: "
          << PQerrorMessage(conn);

return false;


}

bool Database::isConnected() const
{
return conn != nullptr && PQstatus(conn) == CONNECTION_OK;
}

bool Database::executeQuery(const char* query)
{
if (!isConnected())
{
std::cout << "\nDatabase is not connected!\n";
return false;
}


PGresult* result = PQexec(conn, query);

ExecStatusType status = PQresultStatus(result);

if (status == PGRES_COMMAND_OK || status == PGRES_TUPLES_OK)
{
    PQclear(result);
    return true;
}

std::cout << "\nQuery Error: " << PQerrorMessage(conn);

PQclear(result);
return false;


}

PGresult* Database::executeSelect(const char* query)
{
if (!isConnected())
{
std::cout << "\nDatabase is not connected!\n";
return nullptr;
}

PGresult* result = PQexec(conn, query);

if (PQresultStatus(result) == PGRES_TUPLES_OK)
{
    return result;
}

std::cout << "\nQuery Error: " << PQerrorMessage(conn);

PQclear(result);
return nullptr;


}

long long Database::insertVictim(
const char* name,
const char* location,
int peopleAffected,
int injuryLevel,
const char* disasterType,
const char* requiredResource
)
{
if (!isConnected())
{
std::cout << "\nDatabase is not connected!\n";
return -1;
}


std::string people = std::to_string(peopleAffected);
std::string injury = std::to_string(injuryLevel);

const char* values[] = {
    name,
    location,
    people.c_str(),
    injury.c_str(),
    disasterType,
    requiredResource
};

PGresult* result = PQexecParams(
    conn,
    "INSERT INTO victims "
    "(full_name, location_name, people_affected, injury_level, disaster_type, required_resource) "
    "VALUES ($1, $2, $3, $4, $5, $6) "
    "RETURNING victim_id",
    6,
    nullptr,
    values,
    nullptr,
    nullptr,
    0
);

if (PQresultStatus(result) == PGRES_TUPLES_OK)
{
    long long victimID = atoll(PQgetvalue(result, 0, 0));

    PQclear(result);

    std::cout << "\nVictim Inserted Successfully!";
    return victimID;
}

std::cout << "\nVictim Insert Error: "
          << PQerrorMessage(conn);

PQclear(result);
return -1;


}

bool Database::insertEmergencyRequest(
const char* requestID,
long long victimID,
const char* citizenName,
const char* location,
const char* category,
const char* priority,
int priorityScore,
int peopleCount,
const char* description,
const char* contactNumber
)
{
if (!isConnected())
{
std::cout << "\nDatabase is not connected!\n";
return false;
}

std::string score = std::to_string(priorityScore);
std::string people = std::to_string(peopleCount);
std::string victim = std::to_string(victimID);

const char* values[] = {
    requestID,
    victimID > 0 ? victim.c_str() : nullptr,
    citizenName,
    location,
    category,
    priority,
    score.c_str(),
    people.c_str(),
    description,
    contactNumber
};

PGresult* result = PQexecParams(
    conn,
    "INSERT INTO emergency_requests "
    "(request_id, victim_id, citizen_name, location_name, category, "
    "priority, priority_score, people_count, description, contact_number) "
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    10,
    nullptr,
    values,
    nullptr,
    nullptr,
    0
);

if (PQresultStatus(result) == PGRES_COMMAND_OK)
{
    PQclear(result);

    std::cout << "\nEmergency Request Saved Successfully!\n";
    return true;
}

std::cout << "\nEmergency Request Error: "
          << PQerrorMessage(conn);

PQclear(result);
return false;


}
bool Database::insertShelter(int id, const char* name, const char* location, double latitude, double longitude, int capacity)
{
    std::string sid = std::to_string(id);
    std::string lat = std::to_string(latitude);
    std::string lon = std::to_string(longitude);
    std::string cap = std::to_string(capacity);

    const char* values[] = {
        sid.c_str(), name, location, lat.c_str(), lon.c_str(), cap.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "INSERT INTO shelters(shelter_id,shelter_name,location_area,latitude,longitude,total_capacity) VALUES($1,$2,$3,$4,$5,$6)",
        6, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK;
    PQclear(res);
    return success;
}

bool Database::updateShelter(int id, const char* location, int capacity, int occupancy)
{
    std::string sid = std::to_string(id);
    std::string cap = std::to_string(capacity);
    std::string occ = std::to_string(occupancy);

    std::string status = "operational";

    if (occupancy >= capacity)
        status = "full";
    else if (capacity > 0 && occupancy * 100 >= capacity * 80)
        status = "high_occupancy";

    const char* values[] = {
        sid.c_str(), location, cap.c_str(), occ.c_str(), status.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "UPDATE shelters SET location_area=$2,total_capacity=$3,current_occupancy=$4,status=$5,last_updated=CURRENT_TIMESTAMP WHERE shelter_id=$1 AND current_occupancy <= $3",
        5, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK &&
                   std::string(PQcmdTuples(res)) == "1";

    PQclear(res);
    return success;
}
bool Database::updateShelterOccupancy(const char* shelterID, int occupancy)
{
    std::string occ = std::to_string(occupancy);

    const char* values[] = {shelterID, occ.c_str()};

    PGresult* res = PQexecParams(
        conn,
        "UPDATE shelters SET current_occupancy=$2::INTEGER, status=CASE WHEN $2::INTEGER >= total_capacity THEN 'full' WHEN $2::INTEGER * 100 >= total_capacity * 75 THEN 'high_occupancy' ELSE 'operational' END WHERE shelter_id=$1 AND $2::INTEGER BETWEEN 0 AND total_capacity",
        2, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK &&
                   std::string(PQcmdTuples(res)) == "1";

    PQclear(res);
    return success;
}

bool Database::insertShelterResource(const char* shelterID, const char* resourceName, double quantity)
{
    std::string qty = std::to_string(quantity);

    const char* values[] = {
        shelterID, resourceName, qty.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "INSERT INTO shelter_resources(shelter_id,resource_name,current_quantity,initial_quantity) VALUES($1,$2,$3,$3) ON CONFLICT(shelter_id,resource_name) DO UPDATE SET current_quantity=shelter_resources.current_quantity+EXCLUDED.current_quantity,initial_quantity=shelter_resources.initial_quantity+EXCLUDED.initial_quantity,updated_at=CURRENT_TIMESTAMP",
        3, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK;
    PQclear(res);
    return success;
}

bool Database::updateShelterResource(const char* shelterID, const char* resourceName, double quantity)
{
    std::string qty = std::to_string(quantity);

    const char* values[] = {
        shelterID, resourceName, qty.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "UPDATE shelter_resources SET current_quantity=$3,updated_at=CURRENT_TIMESTAMP WHERE shelter_id=$1 AND resource_name=$2 AND $3 >= 0",
        3, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK &&
                   std::string(PQcmdTuples(res)) == "1";

    PQclear(res);
    return success;
}

bool Database::insertRescueTeam(int id, const char* name, const char* location)
{
    std::string tid = std::to_string(id);

    const char* values[] = {
        tid.c_str(), name, location
    };

    PGresult* res = PQexecParams(
        conn,
        "INSERT INTO rescue_teams(team_id,team_name,location,is_available) VALUES($1,$2,$3,TRUE)",
        3, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK;
    PQclear(res);
    return success;
}

bool Database::updateRescueTeamStatus(int id, bool available, int requestID)
{
    std::string tid = std::to_string(id);
    std::string rid = std::to_string(requestID);
    std::string status = available ? "true" : "false";

    const char* values[] = {
        tid.c_str(), status.c_str(),
        available || requestID == 0 ? nullptr : rid.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "UPDATE rescue_teams SET is_available=$2,assigned_request_id=$3 WHERE team_id=$1",
        3, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK &&
                   std::string(PQcmdTuples(res)) == "1";

    PQclear(res);
    return success;
}

bool Database::insertRoad(const char* from, const char* to, double distance)
{
    std::string dist = std::to_string(distance);

    const char* values[] = {
        from, to, dist.c_str()
    };

    PGresult* res = PQexecParams(
        conn,
        "INSERT INTO roads(from_location,to_location,distance_km,is_active) VALUES($1,$2,$3,TRUE) ON CONFLICT(from_location,to_location) DO UPDATE SET distance_km=EXCLUDED.distance_km,is_active=TRUE",
        3, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(res) == PGRES_COMMAND_OK;
    PQclear(res);
    return success;
}
bool Database::checkInEvacuee(
    const char* shelterID,
    const char* headOfFamily,
    int peopleCount,
    const char* originArea,
    const char* medicalNeeds,
    std::string& evacueeID,
    int& currentOccupancy,
    std::string& shelterStatus
)
{
    if (peopleCount <= 0)
        return false;

    std::string count = std::to_string(peopleCount);

    evacueeID = "EVAC-" + std::to_string(std::time(nullptr)) + "-" + std::to_string(rand());

    const char* values[] = {
        shelterID,
        count.c_str(),
        headOfFamily,
        originArea,
        medicalNeeds,
        evacueeID.c_str()
    };

    PGresult* begin = PQexec(conn, "BEGIN");

    if (PQresultStatus(begin) != PGRES_COMMAND_OK)
    {
        PQclear(begin);
        return false;
    }

    PQclear(begin);

    PGresult* result = PQexecParams(
        conn,
        "WITH updated_shelter AS ("
        "UPDATE shelters "
        "SET current_occupancy = current_occupancy + $2::INTEGER, "
        "status = CASE "
        "WHEN current_occupancy + $2::INTEGER >= total_capacity THEN 'full' "
        "WHEN (current_occupancy + $2::INTEGER) * 100 >= total_capacity * 75 THEN 'high_occupancy' "
        "ELSE 'operational' END, "
        "last_updated = CURRENT_TIMESTAMP "
        "WHERE shelter_id = $1 "
        "AND current_occupancy + $2::INTEGER <= total_capacity "
        "RETURNING shelter_id, current_occupancy, status"
        "), inserted_evacuee AS ("
        "INSERT INTO evacuee_logs "
        "(evacuee_id, shelter_id, head_of_family, people_count, origin_area, medical_needs, allocated_block, status) "
        "SELECT $6, shelter_id, $3, $2::INTEGER, $4, $5, 'Block-A-1', 'Checked-In' "
        "FROM updated_shelter "
        "RETURNING evacuee_id, shelter_id"
        ") "
        "SELECT inserted_evacuee.evacuee_id, updated_shelter.current_occupancy, updated_shelter.status "
        "FROM inserted_evacuee "
        "JOIN updated_shelter USING (shelter_id)",
        6, nullptr, values, nullptr, nullptr, 0
    );

    bool success =
        PQresultStatus(result) == PGRES_TUPLES_OK &&
        PQntuples(result) == 1;

    if (success)
    {
        evacueeID = PQgetvalue(result, 0, 0);
        currentOccupancy = std::stoi(PQgetvalue(result, 0, 1));
        shelterStatus = PQgetvalue(result, 0, 2);
    }

    PQclear(result);

    PGresult* finish = PQexec(conn, success ? "COMMIT" : "ROLLBACK");

    bool transactionSuccess =
        PQresultStatus(finish) == PGRES_COMMAND_OK;

    PQclear(finish);

    return success && transactionSuccess;
}
PGresult* Database::getEvacuees(const char* shelterID)
{
    const char* values[] = { shelterID };

    PGresult* result = PQexecParams(
        conn,
        "SELECT evacuee_id, shelter_id, head_of_family, people_count, "
        "origin_area, medical_needs, allocated_block, status, checked_in_at "
        "FROM evacuee_logs "
        "WHERE shelter_id = $1 "
        "ORDER BY evacuee_id",
        1,
        nullptr,
        values,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
{
    std::cerr << "Evacuee Query Error: " << PQerrorMessage(conn) << std::endl;
    PQclear(result);
    return nullptr;
}

    return result;
}
void Database::disconnect()
{
if (conn != nullptr)
{
PQfinish(conn);
conn = nullptr;
}
}

PGconn* Database::getConnection() const
{
return conn;
}
