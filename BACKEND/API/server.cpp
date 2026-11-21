#include <iostream>
#include <string>
#include <cstdlib>
#include "httplib.h"
#include "../Database.h"

using namespace std;

int main()
{
    Database db;

    if (!db.connect())
    {
        std::cout << "Database connection failed. Server stopped." << std::endl;
        return 1;
    }

    httplib::Server server;
    server.new_task_queue = [] {
    return new httplib::ThreadPool(1);
    };
    server.set_default_headers({
    {"Access-Control-Allow-Origin", "http://localhost:3000"},
    {"Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"},
    {"Access-Control-Allow-Headers", "Content-Type"}
});

server.Options(R"(.*)", [](const httplib::Request& req, httplib::Response& res)
{
    res.status = 200;
});
    server.Get("/api/health", [](const httplib::Request& req, httplib::Response& res)
    {
        res.set_content(
        "{\"success\":true,\"message\":\"GarudaResQ API is running\"}",
        "application/json"
    );
    });

    server.Post("/api/emergencies", [&db](const httplib::Request& req, httplib::Response& res)
    {
        try
        {
            string requestID = req.get_param_value("requestID");
            string name = req.get_param_value("name");
            string location = req.get_param_value("location");
            string peopleAffected = req.get_param_value("peopleAffected");
            string injuryLevel = req.get_param_value("injuryLevel");
            string disasterType = req.get_param_value("disasterType");
            string requiredResource = req.get_param_value("requiredResource");
            string citizenName = req.get_param_value("citizenName");
            string category = req.get_param_value("category");
            string priority = req.get_param_value("priority");
            string priorityScore = req.get_param_value("priorityScore");
            string description = req.get_param_value("description");
            string contactNumber = req.get_param_value("contactNumber");

            if (requestID.empty() || name.empty() || location.empty() ||
                peopleAffected.empty() || injuryLevel.empty() ||
                disasterType.empty() || requiredResource.empty() ||
                citizenName.empty() || category.empty() ||
                priority.empty() || priorityScore.empty())
            {
                res.status = 400;
                res.set_content(
                    "{\"success\":false,\"message\":\"Required fields are missing\"}",
                    "application/json"
                );
                return;
            }

            int people = stoi(peopleAffected);
            int injury = stoi(injuryLevel);
            int score = stoi(priorityScore);

            if (people <= 0 || injury < 1 || injury > 5 || score < 0)
            {
                res.status = 400;
                res.set_content(
                    "{\"success\":false,\"message\":\"Invalid numeric values\"}",
                    "application/json"
                );
                return;
            }

            PGconn* conn = db.getConnection();

            PGresult* begin = PQexec(conn, "BEGIN");

            if (PQresultStatus(begin) != PGRES_COMMAND_OK)
            {
                PQclear(begin);
                res.status = 500;
                res.set_content(
                    "{\"success\":false,\"message\":\"Transaction could not start\"}",
                    "application/json"
                );
                return;
            }

            PQclear(begin);

            long long victimID = db.insertVictim(
                name.c_str(),
                location.c_str(),
                people,
                injury,
                disasterType.c_str(),
                requiredResource.c_str()
            );

            if (victimID == -1)
            {
                PQexec(conn, "ROLLBACK");

                res.status = 500;
                res.set_content(
                    "{\"success\":false,\"message\":\"Victim insertion failed\"}",
                    "application/json"
                );
                return;
            }

            bool saved = db.insertEmergencyRequest(
                requestID.c_str(),
                victimID,
                citizenName.c_str(),
                location.c_str(),
                category.c_str(),
                priority.c_str(),
                score,
                people,
                description.c_str(),
                contactNumber.c_str()
            );

            if (!saved)
            {
                PQexec(conn, "ROLLBACK");

                res.status = 500;
                res.set_content(
                    "{\"success\":false,\"message\":\"Emergency insertion failed\"}",
                    "application/json"
                );
                return;
            }

            PGresult* commit = PQexec(conn, "COMMIT");

            if (PQresultStatus(commit) != PGRES_COMMAND_OK)
            {
                PQclear(commit);
                PQexec(conn, "ROLLBACK");

                res.status = 500;
                res.set_content(
                    "{\"success\":false,\"message\":\"Database commit failed\"}",
                    "application/json"
                );
                return;
            }

            PQclear(commit);

            string response =
                "{\"success\":true,\"message\":\"Emergency registered successfully\","
                "\"victimID\":" + to_string(victimID) +
                ",\"requestID\":\"" + requestID + "\"}";

            res.set_content(response, "application/json");
        }
        catch (...)
        {
            res.status = 400;
            res.set_content(
                "{\"success\":false,\"message\":\"Invalid request data\"}",
                "application/json"
            );
        }
    });
auto jsonEscape = [](const string& value)
{
    string output;
    for (char c : value)
    {
        if (c == '"') output += "\\\"";
        else if (c == '\\') output += "\\\\";
        else if (c == '\n') output += "\\n";
        else if (c == '\r') output += "\\r";
        else output += c;
    }
    return output;
};

server.Get("/api/ngo-bases", [&db, &jsonEscape](const httplib::Request&, httplib::Response& res)
{
    PGresult* result = db.executeSelect(
        "SELECT base_id, base_name, short_label, location_area, latitude, longitude, role_description FROM ngo_bases ORDER BY base_name"
    );

    if (!result)
    {
        res.status = 500;
        res.set_content("{\"success\":false}", "application/json");
        return;
    }

    string output = "{\"success\":true,\"data\":[";
    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        if (i > 0) output += ",";

        output += "{\"id\":\"" + jsonEscape(PQgetvalue(result, i, 0)) +
                  "\",\"name\":\"" + jsonEscape(PQgetvalue(result, i, 1)) +
                  "\",\"shortLabel\":\"" + jsonEscape(PQgetvalue(result, i, 2)) +
                  "\",\"locationArea\":\"" + jsonEscape(PQgetvalue(result, i, 3)) +
                  "\",\"latitude\":" + PQgetvalue(result, i, 4) +
                  ",\"longitude\":" + PQgetvalue(result, i, 5) +
                  ",\"roleDescription\":\"" + jsonEscape(PQgetvalue(result, i, 6)) + "\"}";
    }

    output += "]}";
    PQclear(result);
    res.set_content(output, "application/json");
});

server.Get("/api/rescue-teams", [&db, &jsonEscape](const httplib::Request&, httplib::Response& res)
{
    PGresult* result = db.executeSelect(
        "SELECT team_id, team_name, location, is_available, assigned_request_id FROM rescue_teams ORDER BY team_id"
    );

    if (!result)
    {
        res.status = 500;
        res.set_content("{\"success\":false}", "application/json");
        return;
    }

    string output = "{\"success\":true,\"data\":[";
    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        if (i > 0) output += ",";

        output += "{\"teamID\":" + string(PQgetvalue(result, i, 0)) +
                  ",\"teamName\":\"" + jsonEscape(PQgetvalue(result, i, 1)) +
                  "\",\"location\":\"" + jsonEscape(PQgetvalue(result, i, 2)) +
                  "\",\"available\":" + (string(PQgetvalue(result, i, 3)) == "t" ? "true" : "false") +
                  ",\"assignedRequestID\":";

        if (PQgetisnull(result, i, 4))
            output += "null";
        else
            output += "\"" + jsonEscape(PQgetvalue(result, i, 4)) + "\"";

        output += "}";
    }

    output += "]}";
    PQclear(result);
    res.set_content(output, "application/json");
});
server.Get("/api/shelters", [&db](const httplib::Request&, httplib::Response& res)
{
    PGresult* result = db.executeSelect(
        "SELECT s.shelter_id, s.shelter_name, s.location_area, "
        "s.latitude, s.longitude, s.total_capacity, "
        "s.current_occupancy, s.status, s.contact_person, s.phone, "
        "COALESCE(MAX(CASE WHEN r.resource_name = 'foodPacks' THEN r.current_quantity END), 0), "
        "COALESCE(MAX(CASE WHEN r.resource_name = 'waterLiters' THEN r.current_quantity END), 0), "
        "COALESCE(MAX(CASE WHEN r.resource_name = 'medicalKits' THEN r.current_quantity END), 0), "
        "COALESCE(MAX(CASE WHEN r.resource_name = 'blankets' THEN r.current_quantity END), 0) "
        "FROM shelters s "
        "LEFT JOIN shelter_resources r ON s.shelter_id = r.shelter_id "
        "GROUP BY s.shelter_id "
        "ORDER BY s.shelter_id"
    );

    if (!result)
    {
        res.status = 500;
        res.set_content(
            "{\"success\":false,\"message\":\"Shelter fetch failed\"}",
            "application/json"
        );
        return;
    }

    string output = "{\"success\":true,\"data\":[";
    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        if (i > 0) output += ",";

        output += "{\"id\":\"" + string(PQgetvalue(result, i, 0)) +
                  "\",\"name\":\"" + string(PQgetvalue(result, i, 1)) +
                  "\",\"locationArea\":\"" + string(PQgetvalue(result, i, 2)) +
                  "\",\"latitude\":" + string(PQgetvalue(result, i, 3)) +
                  ",\"longitude\":" + string(PQgetvalue(result, i, 4)) +
                  ",\"totalCapacity\":" + string(PQgetvalue(result, i, 5)) +
                  ",\"currentOccupancy\":" + string(PQgetvalue(result, i, 6)) +
                  ",\"status\":\"" + string(PQgetvalue(result, i, 7)) +
                  "\",\"contactPerson\":\"" + string(PQgetvalue(result, i, 8)) +
                  "\",\"phone\":\"" + string(PQgetvalue(result, i, 9)) +
                  "\",\"resources\":{" 
                  "\"foodPacks\":" + string(PQgetvalue(result, i, 10)) +
                  ",\"waterLiters\":" + string(PQgetvalue(result, i, 11)) +
                  ",\"medicalKits\":" + string(PQgetvalue(result, i, 12)) +
                  ",\"blankets\":" + string(PQgetvalue(result, i, 13)) +
                  "}}";
    }

    output += "]}";

    PQclear(result);
    res.set_content(output, "application/json");
});
server.Put("/api/shelters/occupancy", [&db](const httplib::Request& req, httplib::Response& res)
{
    auto getValue = [&](const string& key) -> string
    {
        string pattern = "\"" + key + "\":";
        size_t pos = req.body.find(pattern);

        if (pos == string::npos)
            return "";

        pos += pattern.length();

        while (pos < req.body.size() && req.body[pos] == ' ')
            pos++;

        if (pos < req.body.size() && req.body[pos] == '"')
        {
            size_t end = req.body.find('"', pos + 1);
            return end == string::npos ? "" : req.body.substr(pos + 1, end - pos - 1);
        }

        size_t end = req.body.find_first_of(",}", pos);
        return req.body.substr(pos, end - pos);
    };

    string shelterID = getValue("shelterId");
    string occupancyText = getValue("occupancy");
    string deltaText = getValue("delta");

    if (shelterID.empty() || (occupancyText.empty() && deltaText.empty()))
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Invalid input\"}", "application/json");
        return;
    }

    int value;

    try
    {
        value = stoi(occupancyText.empty() ? deltaText : occupancyText);
    }
    catch (...)
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Invalid occupancy\"}", "application/json");
        return;
    }

    string query;

if (occupancyText.empty())
{
    query =
       "UPDATE shelters SET last_updated = CURRENT_TIMESTAMP, "
    "current_occupancy = current_occupancy + $2::INTEGER "
    "WHERE shelter_id = $1 "
    "AND current_occupancy + $2::INTEGER BETWEEN 0 AND total_capacity "
    "RETURNING current_occupancy";
}
else
{
    query =
        "UPDATE shelters SET last_updated = CURRENT_TIMESTAMP, "
    "current_occupancy = $2::INTEGER "
    "WHERE shelter_id = $1 "
    "AND $2::INTEGER BETWEEN 0 AND total_capacity "
    "RETURNING current_occupancy";
}

    string valueText = to_string(value);
    const char* params[] = {shelterID.c_str(), valueText.c_str()};

    PGresult* result = PQexecParams(
        db.getConnection(),
        query.c_str(),
        2, nullptr, params, nullptr, nullptr, 0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK || PQntuples(result) == 0)
    {
        PQclear(result);
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Shelter not found or capacity exceeded\"}", "application/json");
        return;
    }

    int current = stoi(PQgetvalue(result, 0, 0));
    PQclear(result);

    PGresult* capacityResult = PQexecParams(
        db.getConnection(),
        "SELECT total_capacity FROM shelters WHERE shelter_id=$1",
        1, nullptr, params, nullptr, nullptr, 0
    );

    int capacity = stoi(PQgetvalue(capacityResult, 0, 0));
    PQclear(capacityResult);

    string status = "operational";

    if (current >= capacity)
        status = "full";
    else if (capacity > 0 && current * 100 >= capacity * 75)
        status = "high_occupancy";

    const char* statusParams[] = {shelterID.c_str(), status.c_str()};

    PGresult* statusResult = PQexecParams(
        db.getConnection(),
        "UPDATE shelters SET status=$2 WHERE shelter_id=$1",
        2, nullptr, statusParams, nullptr, nullptr, 0
    );

    PQclear(statusResult);

    string output =
        "{\"success\":true,\"data\":{\"currentOccupancy\":" +
        to_string(current) +
        ",\"status\":\"" + status + "\"}}";

    res.set_content(output, "application/json");
});
server.Put("/api/shelters/resources", [&db](const httplib::Request& req, httplib::Response& res)
{
    auto getValue = [&](const string& key) -> string
    {
        string pattern = "\"" + key + "\":";
        size_t pos = req.body.find(pattern);

        if (pos == string::npos)
            return "";

        pos += pattern.length();

        while (pos < req.body.size() && req.body[pos] == ' ')
            pos++;

        if (pos < req.body.size() && req.body[pos] == '"')
        {
            size_t end = req.body.find('"', pos + 1);
            return end == string::npos ? "" : req.body.substr(pos + 1, end - pos - 1);
        }

        size_t end = req.body.find_first_of(",}", pos);
        return req.body.substr(pos, end - pos);
    };

    std::string shelterID = getValue("shelterId");
    std::string resourceKey = getValue("resourceKey");
    std::string deltaText = getValue("delta");

    if (shelterID.empty() || resourceKey.empty() || deltaText.empty())
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Invalid input\"}", "application/json");
        return;
    }

    string resourceName;

    if (resourceKey == "foodPacks")
        resourceName = "foodPacks";
    else if (resourceKey == "waterLiters")
        resourceName = "waterLiters";
    else if (resourceKey == "medicalKits")
        resourceName = "medicalKits";
    else if (resourceKey == "blankets")
        resourceName = "blankets";
    else
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Invalid resource\"}", "application/json");
        return;
    }

    double delta;

    try
    {
        delta = stod(deltaText);
    }
    catch (...)
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Invalid quantity\"}", "application/json");
        return;
    }

    const char* params[] = {shelterID.c_str(), resourceName.c_str(), deltaText.c_str()};

    PGresult* result = PQexecParams(
        db.getConnection(),
        "UPDATE shelter_resources "
        "SET current_quantity = current_quantity + $3::NUMERIC, updated_at = CURRENT_TIMESTAMP "
        "WHERE shelter_id = $1 AND resource_name = $2 "
        "AND current_quantity + $3::NUMERIC >= 0 "
        "RETURNING current_quantity",
        3, nullptr, params, nullptr, nullptr, 0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK || PQntuples(result) == 0)
{
    string error = PQerrorMessage(db.getConnection());
    PQclear(result);

    res.status = 400;
    res.set_content(
        "{\"success\":false,\"message\":\"" + error + "\"}",
        "application/json"
    );
    return;
}

    string quantity = PQgetvalue(result, 0, 0);
    PQclear(result);

    string output =
        "{\"success\":true,\"data\":{\"quantity\":" + quantity + "}}";

    res.set_content(output, "application/json");
});
server.Post("/api/evacuees", [&db](const httplib::Request& req, httplib::Response& res)
{
    auto getValue = [&](const string& key) -> string
    {
        string pattern = "\"" + key + "\":";
        size_t pos = req.body.find(pattern);

        if (pos == string::npos)
            return "";

        pos += pattern.length();

        while (pos < req.body.size() && req.body[pos] == ' ')
            pos++;

        if (pos < req.body.size() && req.body[pos] == '"')
        {
            size_t end = req.body.find('"', pos + 1);
            return end == string::npos ? "" : req.body.substr(pos + 1, end - pos - 1);
        }

        size_t end = req.body.find_first_of(",}", pos);
        return req.body.substr(pos, end - pos);
    };

    string shelterID = getValue("shelterId");
    string headOfFamily = getValue("headOfFamily");
    string peopleText = getValue("peopleCount");
    string originArea = getValue("originArea");
    string medicalNeeds = getValue("medicalNeeds");

    if (shelterID.empty() || headOfFamily.empty() ||
        peopleText.empty() || originArea.empty())
    {
        res.status = 400;
        res.set_content(
            "{\"success\":false,\"message\":\"Required fields missing\"}",
            "application/json"
        );
        return;
    }

    int peopleCount;

    try
    {
        peopleCount = stoi(peopleText);
    }
    catch (...)
    {
        res.status = 400;
        res.set_content(
            "{\"success\":false,\"message\":\"Invalid people count\"}",
            "application/json"
        );
        return;
    }

    if (peopleCount <= 0)
    {
        res.status = 400;
        res.set_content(
            "{\"success\":false,\"message\":\"Invalid people count\"}",
            "application/json"
        );
        return;
    }

    if (medicalNeeds.empty())
        medicalNeeds = "Standard intake / dry rations";

    string evacueeID;
    string shelterStatus;
    int currentOccupancy = 0;

    bool success = db.checkInEvacuee(
        shelterID.c_str(),
        headOfFamily.c_str(),
        peopleCount,
        originArea.c_str(),
        medicalNeeds.c_str(),
        evacueeID,
        currentOccupancy,
        shelterStatus
    );

    if (!success)
    {
        res.status = 400;
        res.set_content(
            "{\"success\":false,\"message\":\"Check-in failed. Shelter may be full.\"}",
            "application/json"
        );
        return;
    }

    string output =
        "{\"success\":true,\"data\":{"
        "\"evacuee\":{"
        "\"id\":\"" + evacueeID +
        "\",\"allocatedBlock\":\"Block-A-1\""
        "},"
        "\"shelter\":{"
        "\"currentOccupancy\":" + to_string(currentOccupancy) +
        ",\"status\":\"" + shelterStatus + "\""
        "}"
        "}}";

    res.set_content(output, "application/json");
});
server.Get("/api/evacuees", [&db](const httplib::Request& req, httplib::Response& res)
{
    if (!req.has_param("shelterId"))
    {
        res.status = 400;
        res.set_content(
            "{\"success\":false,\"message\":\"shelterId is required\"}",
            "application/json"
        );
        return;
    }

    string shelterID = req.get_param_value("shelterId");

    PGresult* result = db.getEvacuees(shelterID.c_str());

    if (!result)
    {
        res.status = 500;
        res.set_content(
            "{\"success\":false,\"message\":\"Evacuee fetch failed\"}",
            "application/json"
        );
        return;
    }

    string output = "{\"success\":true,\"data\":[";
    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        if (i > 0) output += ",";

        output += "{\"id\":\"" + string(PQgetvalue(result, i, 0)) +
                  "\",\"shelterId\":\"" + string(PQgetvalue(result, i, 1)) +
                  "\",\"headOfFamily\":\"" + string(PQgetvalue(result, i, 2)) +
                  "\",\"peopleCount\":" + string(PQgetvalue(result, i, 3)) +
                  ",\"originArea\":\"" + string(PQgetvalue(result, i, 4)) +
                  "\",\"medicalNeeds\":\"" + string(PQgetvalue(result, i, 5)) +
                  "\",\"allocatedBlock\":\"" + string(PQgetvalue(result, i, 6)) +
                "\",\"status\":\"" + string(PQgetvalue(result, i, 7)) +
"\",\"checkInTime\":\"" + string(PQgetvalue(result, i, 8)) +
"\"}";
    }

    output += "]}";

    PQclear(result);
    res.set_content(output, "application/json");
});
server.Post("/api/rescue-teams/deploy", [&db](const httplib::Request& req, httplib::Response& res)
{
    if (!req.has_param("teamID") || !req.has_param("requestID"))
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"teamID and requestID required\"}", "application/json");
        return;
    }

    string teamID = req.get_param_value("teamID");
    string requestID = req.get_param_value("requestID");

    PGconn* conn = db.getConnection();

    const char* values[] = {teamID.c_str(), requestID.c_str()};

    PGresult* result = PQexecParams(
        conn,
        "UPDATE rescue_teams SET is_available=FALSE, assigned_request_id=$2 "
        "WHERE team_id=$1 AND is_available=TRUE "
        "AND EXISTS (SELECT 1 FROM emergency_requests WHERE request_id=$2 AND request_status='pending')",
        2, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(result) == PGRES_COMMAND_OK &&
                   string(PQcmdTuples(result)) == "1";

    PQclear(result);

    if (success)
    {
        const char* requestValues[] = {requestID.c_str()};
        PGresult* update = PQexecParams(
            conn,
            "UPDATE emergency_requests SET request_status='dispatched', updated_at=CURRENT_TIMESTAMP WHERE request_id=$1",
            1, nullptr, requestValues, nullptr, nullptr, 0
        );

        success = PQresultStatus(update) == PGRES_COMMAND_OK;
        PQclear(update);
    }

    if (!success)
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Deployment failed. Check team availability and request status.\"}", "application/json");
        return;
    }

    res.set_content("{\"success\":true,\"message\":\"Team deployed successfully\"}", "application/json");
});

server.Put("/api/rescue-teams/status", [&db](const httplib::Request& req, httplib::Response& res)
{
    if (!req.has_param("teamID") || !req.has_param("available"))
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"teamID and available required\"}", "application/json");
        return;
    }

    string teamID = req.get_param_value("teamID");
    string available = req.get_param_value("available");

    if (available != "true" && available != "false")
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"available must be true or false\"}", "application/json");
        return;
    }

    const char* values[] = {teamID.c_str(), available.c_str()};

    PGresult* result = PQexecParams(
        db.getConnection(),
        "UPDATE rescue_teams SET is_available=$2::boolean, "
        "assigned_request_id=CASE WHEN $2::boolean THEN NULL ELSE assigned_request_id END "
        "WHERE team_id=$1",
        2, nullptr, values, nullptr, nullptr, 0
    );

    bool success = PQresultStatus(result) == PGRES_COMMAND_OK &&
                   string(PQcmdTuples(result)) == "1";

    PQclear(result);

    if (!success)
    {
        res.status = 400;
        res.set_content("{\"success\":false,\"message\":\"Team status update failed\"}", "application/json");
        return;
    }

    res.set_content("{\"success\":true,\"message\":\"Team status updated\"}", "application/json");
});
    std::cout << "GarudaResQ API Server running at http://localhost:8080" << std::endl;

    server.listen("0.0.0.0", 8080);

    return 0;
}