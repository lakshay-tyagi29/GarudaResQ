#ifndef GARUDARESQ_H
#define GARUDARESQ_H

#include <iostream>
#include <vector>
#include <string>
#include <limits>

#include "PriorityManager.h"
#include "RescueTeam.h"
#include "Shelter.h"
#include "Resource.h"
#include "RouteManager.h"
#include "EmergencyList.h"
#include "EmergencyQueue.h"
#include "Database.h"

class GarudaResQ
{
private:
    PriorityManager priorityManager;
    EmergencyList emergencyList;
    EmergencyQueue emergencyQueue;
    std::vector<RescueTeam> rescueTeams;
    std::vector<Shelter> shelters;
    std::vector<Resource> resources;
    RouteManager routeManager;
    Database db;

    void clearBuffer()
    {
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }

public:
    GarudaResQ()
    {
    db.connect();
    }
    void reportEmergency()
{
    int requestID;
    int peopleAffected;
    int injuryLevel;

    std::string name;
    std::string location;
    std::string disasterType;
    std::string requiredResource;
    std::string description;
    std::string contactNumber;

    std::cout << "\n========== REPORT EMERGENCY ==========\n";

    std::cout << "Request ID: ";
    std::cin >> requestID;

    if (emergencyList.containsRequestID(requestID))
    {
        std::cout << "\nRequest ID already exists.\n";
        return;
    }

    clearBuffer();

    std::cout << "Victim Name: ";
    std::getline(std::cin, name);

    std::cout << "Location: ";
    std::getline(std::cin, location);

    std::cout << "People Affected: ";
    std::cin >> peopleAffected;

    std::cout << "Injury Level (1-5): ";
    std::cin >> injuryLevel;
    clearBuffer();

    std::cout << "Disaster Type: ";
    std::getline(std::cin, disasterType);

    std::cout << "Required Resource: ";
    std::getline(std::cin, requiredResource);

    std::cout << "Contact Number: ";
    std::getline(std::cin, contactNumber);

    std::cout << "Description: ";
    std::getline(std::cin, description);

    Victim temp(
        0,
        name,
        location,
        peopleAffected,
        injuryLevel,
        disasterType,
        requiredResource
    );

    int priorityScore = temp.calculatePriority();

    std::string priority;

    if (priorityScore >= 80)
        priority = "critical";
    else if (priorityScore >= 60)
        priority = "high";
    else if (priorityScore >= 40)
        priority = "medium";
    else
        priority = "low";
    std::string category;

if (disasterType == "flood" || disasterType == "Flood")
    category = "Flood";
else if (disasterType == "landslide" || disasterType == "Landslide")
    category = "Landslide";
else if (disasterType == "structural damage" || disasterType == "Structural Damage")
    category = "Structural Damage";
else if (disasterType == "medical" || disasterType == "Medical")
    category = "Medical";
else
{
    cout << "\nInvalid Category! Please enter Flood, Landslide, Structural Damage or Medical.\n";
    return;
}

    long long victimID = db.insertVictim(
        name.c_str(),
        location.c_str(),
        peopleAffected,
        injuryLevel,
        category.c_str(),
        requiredResource.c_str()
    );

    if (victimID == -1)
    {
        std::cout << "\nVictim database insertion failed.\n";
        return;
    }

    if (victimID > std::numeric_limits<int>::max())
    {
        std::cout << "\nGenerated Victim ID exceeds C++ Victim ID limit.\n";
        return;
    }

    Victim victim(
        static_cast<int>(victimID),
        name,
        location,
        peopleAffected,
        injuryLevel,
        disasterType,
        requiredResource
    );

    bool saved = db.insertEmergencyRequest(
        std::to_string(requestID).c_str(),
        victimID,
        name.c_str(),
        location.c_str(),
        disasterType.c_str(),
        priority.c_str(),
        priorityScore,
        peopleAffected,
        description.c_str(),
        contactNumber.c_str()
    );

    if (!saved)
    {
        std::cout << "\nEmergency request database insertion failed.\n";
        return;
    }

    EmergencyRequest request(requestID, victim);

    priorityManager.addEmergency(request);
    emergencyList.addEmergency(request);
    emergencyQueue.enqueue(request);

    std::cout << "\nEmergency Reported Successfully!\n";
}

    void showEmergencies()
    {
        priorityManager.displayQueue();
    }

    void showEmergencyList()
    {
        emergencyList.displayEmergencies();
    }

    void searchEmergency()
    {
        int requestID;

        std::cout << "\n========== SEARCH EMERGENCY ==========\n";

        std::cout << "Enter Request ID: ";
        std::cin >> requestID;

        emergencyList.searchEmergency(requestID);
    }

    void sortEmergencies()
    {
        emergencyList.sortByPriority();
    }

    void showEmergencyQueue()
    {
        emergencyQueue.displayQueue();
    }

    void processEmergency()
    {
        if (priorityManager.isEmpty())
        {
            std::cout << "\nNo pending emergency requests.\n";
            return;
        }

        bool teamAssigned = false;

        for (size_t i = 0; i < rescueTeams.size(); i++)
        {
            if (rescueTeams[i].isAvailable())
            {
                EmergencyRequest request = priorityManager.getHighestPriority();

                std::cout << "\n========== EMERGENCY ASSIGNMENT ==========\n";
                std::cout << "\nEmergency Request ID: "
                          << request.getRequestID();

                std::cout << "\nVictim: "
                          << request.getVictim().getName();

                std::cout << "\nLocation: "
                          << request.getVictim().getLocation();

                std::cout << "\nPriority: "
                          << request.getPriority();

                std::cout << "\n\nRescue Team Assigned:";
                std::cout << "\nTeam ID: "
                          << rescueTeams[i].getTeamID();

                std::cout << "\nTeam Name: "
                          << rescueTeams[i].getTeamName();

                std::cout << "\nTeam Location: "
                          << rescueTeams[i].getLocation();
                if (!db.updateRescueTeamStatus(
        rescueTeams[i].getTeamID(),
        false,
        request.getRequestID()))
{
    std::cout << "\nDatabase update failed.\n";
    return;
}
                rescueTeams[i].assignTeam();

                priorityManager.removeHighestPriority();
                emergencyList.markProcessed(request.getRequestID());
                emergencyQueue.removeByID(request.getRequestID());

                std::cout << "\n\nEmergency assigned successfully.\n";
                std::cout << "\nRescue team status: Assigned\n";

                teamAssigned = true;
                break;
            }
        }

        if (!teamAssigned)
        {
            std::cout << "\nNo rescue team is currently available.\n";
            std::cout << "Emergency remains in the priority queue.\n";
        }
    }

    void addRescueTeam()
    {
        int id;
        std::string name;
        std::string location;

        std::cout << "\n========== ADD RESCUE TEAM ==========\n";

        std::cout << "Team ID: ";
        std::cin >> id;
        clearBuffer();

        std::cout << "Team Name: ";
        std::getline(std::cin, name);

        std::cout << "Location: ";
        std::getline(std::cin, location);
        for (size_t i = 0; i < rescueTeams.size(); i++)
        {
         if (rescueTeams[i].getTeamID() == id)
         {
           std::cout << "\nTeam ID already exists.\n";
           return;
         }
        }

        RescueTeam team(id, name, location);
        if (!db.insertRescueTeam(id, name.c_str(), location.c_str()))
{
    std::cout << "\nDatabase insertion failed.\n";
    return;
}
        rescueTeams.push_back(team);

        std::cout << "\nRescue team added successfully.\n";
    }

    void makeRescueTeamAvailable()
    {
        if (rescueTeams.empty())
        {
            std::cout << "\nNo rescue teams available.\n";
            return;
        }

        int id;

        std::cout << "\nEnter Team ID: ";
        std::cin >> id;

        for (size_t i = 0; i < rescueTeams.size(); i++)
        {
            if (rescueTeams[i].getTeamID() == id)
            {
                if (rescueTeams[i].isAvailable())
                {
                    std::cout << "\nTeam is already available.\n";
                    return;
                }
                if (!db.updateRescueTeamStatus(id, true))
{
    std::cout << "\nDatabase update failed.\n";
    return;
}
                rescueTeams[i].makeAvailable();

                std::cout << "\nRescue team is now available.\n";
                return;
            }
        }

        std::cout << "\nTeam ID not found.\n";
    }

    void showRescueTeams()
    {
        if (rescueTeams.empty())
        {
            std::cout << "\nNo rescue teams available.\n";
            return;
        }

        std::cout << "\n========== RESCUE TEAMS ==========\n";

        for (size_t i = 0; i < rescueTeams.size(); i++)
        {
            rescueTeams[i].display();
        }
    }

    void addShelter()
    {
        int id;
        std::string location;
        int capacity;

        std::cout << "\n========== ADD SHELTER ==========\n";

        std::cout << "Shelter ID: ";
        std::cin >> id;
        clearBuffer();

        std::cout << "Location: ";
        std::getline(std::cin, location);
        if (location.empty())
        {
         std::cout << "\nLocation cannot be empty.\n";
         return;
        }
        std::cout << "Capacity: ";
        std::cin >> capacity;
        double latitude, longitude;

std::cout << "Latitude: ";
std::cin >> latitude;

std::cout << "Longitude: ";
std::cin >> longitude;
        for (size_t i = 0; i < shelters.size(); i++)
        {
         if (shelters[i].getShelterID() == id)
         {
          std::cout << "\nShelter ID already exists.\n";
          return;
         }
        }
        if (!db.insertShelter(
        id,
        location.c_str(),
        location.c_str(),
        latitude,
        longitude,
        capacity))
{
    std::cout << "\nDatabase insertion failed.\n";
    return;
}

        Shelter shelter(id, location, capacity);

        shelters.push_back(shelter);

        std::cout << "\nShelter added successfully.\n";
    }

    void updateShelter()
    {
        if (shelters.empty())
        {
            std::cout << "\nNo shelters available to update.\n";
            return;
        }

        int id;

        std::cout << "\nEnter Shelter ID: ";
        std::cin >> id;

        for (size_t i = 0; i < shelters.size(); i++)
        {
            if (shelters[i].getShelterID() == id)
            {
                std::string location;
                int capacity;

                clearBuffer();

                std::cout << "Enter new location: ";
                std::getline(std::cin, location);

                std::cout << "Enter new capacity: ";
                std::cin >> capacity;
                if (capacity < shelters[i].getOccupancy())
{
    std::cout << "\nCapacity cannot be less than occupancy.\n";
    return;
}

if (!db.updateShelter(
        id,
        location.c_str(),
        capacity,
        shelters[i].getOccupancy()))
{
    std::cout << "\nDatabase update failed.\n";
    return;
}
                shelters[i].updateShelter(location, capacity);
                return;
            }
        }

        std::cout << "\nShelter ID not found.\n";
    }

    void assignPeopleToShelter()
    {
        if (shelters.empty())
        {
            std::cout << "\nNo shelters available.\n";
            return;
        }

        int id;
        int people;

        std::cout << "\nEnter Shelter ID: ";
        std::cin >> id;

        for (size_t i = 0; i < shelters.size(); i++)
        {
            if (shelters[i].getShelterID() == id)
            {
                std::cout << "Enter number of people: ";
                std::cin >> people;

                if (people <= 0 || !shelters[i].hasSpace(people))
{
    std::cout << "\nNot enough shelter space.\n";
    return;
}

int newOccupancy = shelters[i].getOccupancy() + people;

if (!db.updateShelter(
        id,
        shelters[i].getLocation().c_str(),
        shelters[i].getCapacity(),
        newOccupancy))
{
    std::cout << "\nDatabase update failed.\n";
    return;
}

shelters[i].addPeople(people);

                std::cout << "\nAvailable space: "
                          << shelters[i].getAvailableSpace() << "\n";

                return;
            }
        }

        std::cout << "\nShelter ID not found.\n";
    }

    void showShelters()
    {
        if (shelters.empty())
        {
            std::cout << "\nNo shelters available.\n";
            return;
        }

        std::cout << "\n========== SHELTERS ==========\n";

        for (size_t i = 0; i < shelters.size(); i++)
        {
            shelters[i].display();
        }
    }

    void addResource()
    {
        int id;
        std::string name;
        int quantity;

        std::cout << "\n========== ADD RESOURCE ==========\n";

        std::cout << "Resource ID: ";
        std::cin >> id;
        clearBuffer();

        std::cout << "Resource Name: ";
        std::getline(std::cin, name);

        std::cout << "Quantity: ";
        std::cin >> quantity;
        if (quantity < 0)
        {
         std::cout << "\nQuantity cannot be negative.\n";
         return;
        }
        int shelterID;

std::cout << "Shelter ID: ";
std::cin >> shelterID;

std::string dbName = name;

if (name == "Food Packs")
    dbName = "foodPacks";
else if (name == "Water Liters")
    dbName = "waterLiters";
else if (name == "Medical Kits")
    dbName = "medicalKits";
else if (name == "Generator Power")
    dbName = "generatorPower";
else if (name == "Blankets")
    dbName = "blankets";

if (dbName != "foodPacks" &&
    dbName != "waterLiters" &&
    dbName != "medicalKits" &&
    dbName != "generatorPower" &&
    dbName != "blankets")
{
    std::cout << "\nInvalid resource name.\n";
    return;
}

std::string sid = std::to_string(shelterID);

if (!db.insertShelterResource(sid.c_str(), dbName.c_str(), quantity))
{
    std::cout << "\nDatabase insertion failed.\n";
    return;
}
        for (size_t i = 0; i < resources.size(); i++)
        {
         if (resources[i].getResourceID() == id)
         {
           std::cout << "\nResource ID already exists.\n";
           return;
         }
        }

        Resource resource(id, name, quantity);

        resources.push_back(resource);

        std::cout << "\nResource added successfully.\n";
    }

    void showResources()
    {
        if (resources.empty())
        {
            std::cout << "\nNo resources available.\n";
            return;
        }

        std::cout << "\n========== RESOURCES ==========\n";
        for (size_t i = 0; i < resources.size(); i++)
        {
            resources[i].display();
        }
    }

    void distributeResource()
{
    if (resources.empty())
    {
        std::cout << "\nNo resources available.\n";
        return;
    }

    int id, amount, shelterID;

    std::cout << "\nEnter Resource ID: ";
    std::cin >> id;

    for (size_t i = 0; i < resources.size(); i++)
    {
        if (resources[i].getResourceID() == id)
        {
            int available = resources[i].getQuantity();

            std::cout << "Available quantity: " << available << "\n";
            std::cout << "Enter quantity to distribute: ";
            std::cin >> amount;

            if (amount <= 0 || amount > available)
            {
                std::cout << "\nInvalid quantity.\n";
                return;
            }

            std::cout << "Enter Shelter ID: ";
            std::cin >> shelterID;

            std::string name = resources[i].getResourceName();

            if (name == "Food Packs")
                name = "foodPacks";
            else if (name == "Water Liters")
                name = "waterLiters";
            else if (name == "Medical Kits")
                name = "medicalKits";
            else if (name == "Generator Power")
                name = "generatorPower";
            else if (name != "foodPacks" &&
                     name != "waterLiters" &&
                     name != "medicalKits" &&
                     name != "generatorPower" &&
                     name != "blankets")
            {
                std::cout << "\nInvalid resource name.\n";
                return;
            }

            double remaining = available - amount;
            std::string sid = std::to_string(shelterID);

            if (!db.updateShelterResource(
                    sid.c_str(),
                    name.c_str(),
                    remaining))
            {
                std::cout << "\nDatabase update failed.\n";
                return;
            }

            resources[i].distribute(amount);

            std::cout << "\nResource distributed successfully.\n";
            std::cout << "Remaining quantity: "
                      << resources[i].getQuantity() << "\n";

            return;
        }
    }

    std::cout << "\nResource ID not found.\n";
}
    void addRoad()
    {
        std::string from;
        std::string to;
        int distance;

        std::cout << "\n========== ADD ROAD ==========\n";

        clearBuffer();

        std::cout << "From Location: ";
        std::getline(std::cin, from);

        std::cout << "To Location: ";
        std::getline(std::cin, to);

        std::cout << "Distance (km): ";
        std::cin >> distance;
        if (distance < 0 || from.empty() || to.empty() || from == to)
{
    std::cout << "\nInvalid road details.\n";
    return;
}

if (!db.insertRoad(from.c_str(), to.c_str(), distance))
{
    std::cout << "\nDatabase insertion failed.\n";
    return;
}
        routeManager.addRoad(from, to, distance);
    }

    void showRoads()
    {
        routeManager.displayRoutes();
    }

    void findRoute()
    {
        std::string start;
        std::string destination;

        std::cout << "\n========== FIND SHORTEST ROUTE ==========\n";

        clearBuffer();

        std::cout << "Start Location: ";
        std::getline(std::cin, start);

        std::cout << "Destination: ";
        std::getline(std::cin, destination);

        routeManager.findShortestRoute(start, destination);
    }

    void menu()
    {
        int choice;

        do
        {
            std::cout << "\n\n========================================";
            std::cout << "\n           GARUDARESQ";
            std::cout << "\n========================================";

            std::cout << "\n1. Report Emergency";
            std::cout << "\n2. Show Emergency Queue";
            std::cout << "\n3. Process Highest Priority Emergency";
            std::cout << "\n4. Add Rescue Team";
            std::cout << "\n5. Show Rescue Teams";
            std::cout << "\n6. Add Shelter";
            std::cout << "\n7. Show Shelters";
            std::cout << "\n8. Add Resource";
            std::cout << "\n9. Show Resources";
            std::cout << "\n10. Add Road";
            std::cout << "\n11. Show Roads";
            std::cout << "\n12. Find Shortest Route";
            std::cout << "\n13. Show Emergency Linked List";
            std::cout << "\n14. Search Emergency";
            std::cout << "\n15. Sort Emergencies by Priority";
            std::cout << "\n16. Show Normal Emergency Queue";
            std::cout << "\n17. Update Shelter";
            std::cout << "\n18. Assign People to Shelter";
            std::cout << "\n19. Make Rescue Team Available";
            std::cout << "\n20. Distribute Resource";
            std::cout << "\n0. Exit";

            std::cout << "\n\nEnter choice: ";

            if (!(std::cin >> choice))
            {
               std::cin.clear();
               std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
               std::cout << "\nInvalid input. Please enter a number.\n";
               continue;
            }
            switch (choice)
            {
                case 1:
                    reportEmergency();
                    break;

                case 2:
                    showEmergencies();
                    break;

                case 3:
                    processEmergency();
                    break;

                case 4:
                    addRescueTeam();
                    break;

                case 5:
                    showRescueTeams();
                    break;

                case 6:
                    addShelter();
                    break;

                case 7:
                    showShelters();
                    break;

                case 8:
                    addResource();
                    break;

                case 9:
                    showResources();
                    break;

                case 10:
                    addRoad();
                    break;

                case 11:
                    showRoads();
                    break;

                case 12:
                    findRoute();
                    break;

                case 13:
                    showEmergencyList();
                    break;

                case 14:
                    searchEmergency();
                    break;

                case 15:
                    sortEmergencies();
                    break;

                case 16:
                    showEmergencyQueue();
                    break;

                case 17:
                    updateShelter();
                    break;

                case 18:
                    assignPeopleToShelter();
                    break;

                case 19:
                    makeRescueTeamAvailable();
                    break;

                case 20:
                    distributeResource();
                    break;

                case 0:
                    std::cout << "\nExiting GarudaResQ...\n";
                    break;

                default:
                    std::cout << "\nInvalid choice.\n";
            }

        } while (choice != 0);
    }
};

#endif