#ifndef SHELTER_H
#define SHELTER_H

#include <iostream>
#include <string>

using namespace std;

class Shelter
{
private:
    int shelterID;
    string location;
    int capacity;
    int occupancy;

public:

    Shelter(int id, string loc, int cap)
    {
        shelterID = id;
        location = loc;
        capacity = cap;
        occupancy = 0;
    }

    int getShelterID() const
    {
        return shelterID;
    }

    string getLocation() const
    {
        return location;
    }

    int getCapacity() const
    {
        return capacity;
    }

    int getOccupancy() const
    {
        return occupancy;
    }

    int getAvailableSpace() const
    {
        return capacity - occupancy;
    }

    bool hasSpace(int people) const
    {
        return occupancy + people <= capacity;
    }

    void addPeople(int people)
    {
        if (hasSpace(people))
        {
            occupancy += people;
            cout << "\nPeople added to shelter successfully.";
        }
        else
        {
            cout << "\nNot enough space in shelter.";
        }
    }

    void display() const
    {
        cout << "\n----------------------------------------";
        cout << "\nShelter ID       : " << shelterID;
        cout << "\nLocation         : " << location;
        cout << "\nCapacity         : " << capacity;
        cout << "\nCurrent Occupancy: " << occupancy;
        cout << "\nAvailable Space  : " << getAvailableSpace();
        cout << "\n----------------------------------------\n";
    }
};

#endif // SHELTER_H
