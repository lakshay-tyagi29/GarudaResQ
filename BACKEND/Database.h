#ifndef DATABASE_H
#define DATABASE_H
#include <string>
#include <iostream>
#include <libpq-fe.h>

class Database
{
private:
    PGconn* conn;

public:
    Database();
    ~Database();

    bool connect();
    bool isConnected() const;

    bool executeQuery(const char* query);
    PGresult* executeSelect(const char* query);
    bool insertShelter(int id, const char* name, const char* location, double latitude, double longitude, int capacity);

    bool updateShelter(int id, const char* location, int capacity, int occupancy);
    bool updateShelterOccupancy(const char* shelterID, int occupancy);

bool updateShelterResource(const char* shelterID, const char* resourceName, double quantity);


bool checkInEvacuee(
    const char* shelterID,
    const char* headOfFamily,
    int peopleCount,
    const char* originArea,
    const char* medicalNeeds,
    std::string& evacueeID,
    int& currentOccupancy,
    std::string& shelterStatus
);
PGresult* getEvacuees(const char* shelterID);
    bool insertShelterResource(const char* shelterID, const char* resourceName, double quantity);

    bool insertRescueTeam(int id, const char* name, const char* location);

    bool updateRescueTeamStatus(int id, bool available, int requestID = 0);

    bool insertRoad(const char* from, const char* to, double distance);
    long long insertVictim(
        const char* name,
        const char* location,
        int peopleAffected,
        int injuryLevel,
        const char* disasterType,
        const char* requiredResource
    );

    bool insertEmergencyRequest(
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
    );

    void disconnect();
    PGconn* getConnection() const;
};

#endif