#ifndef RESCUETEAM_H
#define RESCUETEAM_H

#include <iostream>
#include <string>

using namespace std;

class RescueTeam
{
private:
    int teamID;
    string teamName;
    string location;
    bool available;

public:

    RescueTeam(int id, string name, string loc)
    {
        teamID = id;
        teamName = name;
        location = loc;
        available = true;
    }

    int getTeamID() const
    {
        return teamID;
    }

    string getTeamName() const
    {
        return teamName;
    }

    string getLocation() const
    {
        return location;
    }

    bool isAvailable() const
    {
        return available;
    }

    void assignTeam()
    {
        available = false;
    }

    void makeAvailable()
    {
        available = true;
    }
    

    void display() const
    {
        cout << "\n----------------------------------------";
        cout << "\nTeam ID    : " << teamID;
        cout << "\nTeam Name  : " << teamName;
        cout << "\nLocation   : " << location;
        cout << "\nStatus     : "
             << (available ? "Available" : "Assigned");
        cout << "\n----------------------------------------\n";
    }
};

#endif // RESCUETEAM_H
