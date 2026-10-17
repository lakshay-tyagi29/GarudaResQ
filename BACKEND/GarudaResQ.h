#ifndef GARUDARESQ_H
#define GARUDARESQ_H

#include <iostream>
#include <vector>
#include <string>

#include "PriorityManager.h"
#include "RescueTeam.h"
#include "Shelter.h"
#include "Resource.h"
#include "RouteManager.h"
#include "EmergencyList.h"
#include "EmergencyQueue.h"

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

public:

    void reportEmergency()
    {
        int requestID;
        int victimID;
        std::string name;
        std::string location;
        int peopleAffected;
        int injuryLevel;
        std::string disasterType;
        std::string requiredResource;

        std::cout << "\n========== REPORT EMERGENCY ==========\n";

        std::cout << "Request ID: ";
        std::cin >> requestID;

        std::cout << "Victim ID: ";
        std::cin >> victimID;

        std::cin.ignore();

        std::cout << "Victim Name: ";
        std::getline(std::cin, name);

        std::cout << "Location: ";
        std::getline(std::cin, location);

        std::cout << "People Affected: ";
        std::cin >> peopleAffected;

        std::cout << "Injury Level (1-5): ";
        std::cin >> injuryLevel;

        std::cin.ignore();

        std::cout << "Disaster Type: ";
        std::getline(std::cin, disasterType);

        std::cout << "Required Resource: ";
        std::getline(std::cin, requiredResource);

        Victim victim(
            victimID,
            name,
            location,
            peopleAffected,
            injuryLevel,
            disasterType,
            requiredResource
        );

        EmergencyRequest request(requestID, victim);

        if (emergencyList.containsRequestID(requestID))
        {
            std::cout << "\nRequest ID already exists. Please use a unique ID.\n";
            return;
        }

        priorityManager.addEmergency(request);
        emergencyList.addEmergency(request);
        emergencyQueue.enqueue(request);
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

        for (int i = 0; i < rescueTeams.size(); i++)
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

        rescueTeams[i].assignTeam();

        priorityManager.removeHighestPriority();
        emergencyList.markProcessed(request.getRequestID());
        emergencyQueue.removeByID(request.getRequestID());

        std::cout << "\n\nEmergency assigned successfully.";
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

        std::cin.ignore();

        std::cout << "Team Name: ";
        std::getline(std::cin, name);

        std::cout << "Location: ";
        std::getline(std::cin, location);

        RescueTeam team(id, name, location);

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

    for (int i = 0; i < rescueTeams.size(); i++)
    {
        if (rescueTeams[i].getTeamID() == id)
        {
            if (rescueTeams[i].isAvailable())
            {
                std::cout << "\nTeam is already available.\n";
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

        for (auto &team : rescueTeams)
        {
            team.display();
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

        std::cin.ignore();

        std::cout << "Location: ";
        std::getline(std::cin, location);

        std::cout << "Capacity: ";
        std::cin >> capacity;

        Shelter shelter(id, location, capacity);

        shelters.push_back(shelter);

        std::cout << "\nShelter added successfully.\n";
    }

    void showShelters()
    {
        if (shelters.empty())
        {
            std::cout << "\nNo shelters available.\n";
            return;
        }

        std::cout << "\n========== SHELTERS ==========\n";

        for (auto &shelter : shelters)
        {
            shelter.display();
        }
    }

    void updateShelter()
    {
    if (shelters.empty())
    {
        cout << "\nNo shelters available to update.\n";
        return;
    }

    int id;

    cout << "\nEnter Shelter ID: ";
    cin >> id;

    for (int i = 0; i < shelters.size(); i++)
    {
        if (shelters[i].getShelterID() == id)
        {
            string location;
            int capacity;

            cin.ignore();

            cout << "Enter new location: ";
            getline(cin, location);

            cout << "Enter new capacity: ";
            cin >> capacity;

            shelters[i].updateShelter(location, capacity);
            return;
        }
    }

    cout << "\nShelter ID not found.\n";

    }

    void assignPeopleToShelter()
    {
    if (shelters.empty())
    {
        cout << "\nNo shelters available.\n";
        return;
    }

    int id;
    int people;

    cout << "\nEnter Shelter ID: ";
    cin >> id;

    for (int i = 0; i < shelters.size(); i++)
    {
        if (shelters[i].getShelterID() == id)
        {
            cout << "Enter number of people: ";
            cin >> people;

            shelters[i].addPeople(people);

            cout << "\nAvailable space: "
                 << shelters[i].getAvailableSpace() << "\n";

            return;
        }
    }

    cout << "\nShelter ID not found.\n";
    }

    void addResource()
    {
        int id;
        std::string name;
        int quantity;

        std::cout << "\n========== ADD RESOURCE ==========\n";

        std::cout << "Resource ID: ";
        std::cin >> id;

        std::cin.ignore();

        std::cout << "Resource Name: ";
        std::getline(std::cin, name);

        std::cout << "Quantity: ";
        std::cin >> quantity;

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

        for (auto &resource : resources)
        {
            resource.display();
        }
    }

    void addRoad()
    {
        std::string from;
        std::string to;
        int distance;

        std::cout << "\n========== ADD ROAD ==========\n";

        std::cin >> std::ws;

        std::cout << "From Location: ";
        std::getline(std::cin, from);

        std::cout << "To Location: ";
        std::getline(std::cin, to);

        std::cout << "Distance (km): ";
        std::cin >> distance;

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

        std::cin >> std::ws;

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
            std::cout << "\n0. Exit";

            std::cout << "\n\nEnter choice: ";
            std::cin >> choice;

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
