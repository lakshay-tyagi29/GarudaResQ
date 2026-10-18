#ifndef SHELTER_H
#define SHELTER_H

#include <iostream>
#include <string>

class Shelter
{
private:
    int shelterID;
    std::string location;
    int capacity;
    int occupancy;

public:
    Shelter(int id, const std::string &loc, int cap)
        : shelterID(id), location(loc), capacity(cap < 0 ? 0 : cap), occupancy(0)
    {
    }

    int getShelterID() const
    {
        return shelterID;
    }

    std::string getLocation() const
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
        return people >= 0 && (occupancy + people) <= capacity;
    }

    void addPeople(int people)
    {
        if (people <= 0)
        {
            std::cout << "\nNumber of people must be positive.";
            return;
        }

        if (hasSpace(people))
        {
            occupancy += people;
            std::cout << "\nPeople added to shelter successfully.";
        }
        else
        {
            std::cout << "\nNot enough space in shelter.";
        }
    }

    bool updateShelter(const std::string &newLocation, int newCapacity)
    {
        if (newLocation.empty() || newCapacity < occupancy)
        {
            std::cout << "\nInvalid location or capacity.";
            return false;
        }

        location = newLocation;
        capacity = newCapacity;

        std::cout << "\nShelter updated successfully.";
        return true;
    }

    void display() const
    {
        std::cout << "\n----------------------------------------"
                  << "\nShelter ID       : " << shelterID
                  << "\nLocation         : " << location
                  << "\nCapacity         : " << capacity
                  << "\nCurrent Occupancy: " << occupancy
                  << "\nAvailable Space  : " << getAvailableSpace()
                  << "\n----------------------------------------\n";
    }
};

#endif
