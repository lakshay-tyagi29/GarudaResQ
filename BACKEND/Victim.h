#ifndef VICTIM_H
#define VICTIM_H

#include <iostream>
#include <string>

class Victim
{
private:
    int victimID;
    std::string name;
    std::string location;
    int peopleAffected;
    int injuryLevel;
    std::string disasterType;
    std::string requiredResource;

public:
    Victim()
        : victimID(0), peopleAffected(0), injuryLevel(1) {}

    Victim(int id, const std::string &n, const std::string &loc, int people,
           int injury, const std::string &disaster, const std::string &resource)
        : victimID(id),
          name(n),
          location(loc),
          peopleAffected(people < 0 ? 0 : people),
          injuryLevel((injury < 1 || injury > 5) ? 1 : injury),
          disasterType(disaster),
          requiredResource(resource) {}

    int getID() const
    {
        return victimID;
    }

    std::string getName() const
    {
        return name;
    }

    std::string getLocation() const
    {
        return location;
    }

    int getPeopleAffected() const
    {
        return peopleAffected;
    }

    int getInjuryLevel() const
    {
        return injuryLevel;
    }

    std::string getDisasterType() const
    {
        return disasterType;
    }

    std::string getRequiredResource() const
    {
        return requiredResource;
    }

    int calculatePriority() const
    {
        int priority = (injuryLevel * 10) + peopleAffected;
        return (priority > 100) ? 100 : priority;
    }

    void display() const
    {
        std::cout << "\n----------------------------------------\n"
                  << "Victim ID        : " << victimID << "\n"
                  << "Name             : " << name << "\n"
                  << "Location         : " << location << "\n"
                  << "People Affected  : " << peopleAffected << "\n"
                  << "Injury Level     : " << injuryLevel << "/5\n"
                  << "Disaster Type    : " << disasterType << "\n"
                  << "Required Resource: " << requiredResource << "\n"
                  << "Priority         : " << calculatePriority() << "\n"
                  << "----------------------------------------\n";
    }
};

#endif
