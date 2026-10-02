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

using namespace std;

class GarudaResQ
{
private:
    PriorityManager priorityManager;
    EmergencyList emergencyList;
    EmergencyQueue emergencyQueue;
    vector<RescueTeam> rescueTeams;
    vector<Shelter> shelters;
    vector<Resource> resources;
    RouteManager routeManager;

public:

    void reportEmergency()
    {
        int requestID;
        int victimID;
        string name;
        string location;
        int peopleAffected;
        int injuryLevel;
        string disasterType;
        string requiredResource;

        cout << "\n========== REPORT EMERGENCY ==========\n";

        cout << "Request ID: ";
        cin >> requestID;

        cout << "Victim ID: ";
        cin >> victimID;

        cin.ignore();

        cout << "Victim Name: ";
        getline(cin, name);

        cout << "Location: ";
        getline(cin, location);

        cout << "People Affected: ";
        cin >> peopleAffected;

        cout << "Injury Level (1-5): ";
        cin >> injuryLevel;

        cin.ignore();

        cout << "Disaster Type: ";
        getline(cin, disasterType);

        cout << "Required Resource: ";
        getline(cin, requiredResource);

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

    cout << "\n========== SEARCH EMERGENCY ==========\n";

    cout << "Enter Request ID: ";
    cin >> requestID;

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
            cout << "\nNo pending emergency requests.\n";
            return;
        }

        bool teamAssigned = false;

        for (auto &team : rescueTeams)
        {
            if (team.isAvailable())
            {
                EmergencyRequest request =
                    priorityManager.getHighestPriority();

                cout << "\n========== EMERGENCY ASSIGNMENT ==========\n";

                cout << "\nEmergency Request ID: "
                     << request.getRequestID();

                cout << "\nVictim: "
                     << request.getVictim().getName();

                cout << "\nLocation: "
                     << request.getVictim().getLocation();

                cout << "\nPriority: "
                     << request.getPriority();

                cout << "\n\nRescue Team Assigned:";
                cout << "\nTeam ID: "
                     << team.getTeamID();

                cout << "\nTeam Name: "
                     << team.getTeamName();

                cout << "\nTeam Location: "
                     << team.getLocation();

                team.assignTeam();

                priorityManager.processHighestPriority();

                cout << "\n\nEmergency assigned successfully.";
                cout << "\nRescue team status: Assigned\n";

                teamAssigned = true;

                break;
            }
        }

        if (!teamAssigned)
        {
            cout << "\nNo rescue team is currently available.\n";
            cout << "Emergency remains in the priority queue.\n";
        }
    }

    void addRescueTeam()
    {
        int id;
        string name;
        string location;

        cout << "\n========== ADD RESCUE TEAM ==========\n";

        cout << "Team ID: ";
        cin >> id;

        cin.ignore();

        cout << "Team Name: ";
        getline(cin, name);

        cout << "Location: ";
        getline(cin, location);

        RescueTeam team(id, name, location);

        rescueTeams.push_back(team);

        cout << "\nRescue team added successfully.\n";
    }

    void showRescueTeams()
    {
        if (rescueTeams.empty())
        {
            cout << "\nNo rescue teams available.\n";
            return;
        }

        cout << "\n========== RESCUE TEAMS ==========\n";

        for (auto &team : rescueTeams)
        {
            team.display();
        }
    }

    void addShelter()
    {
        int id;
        string location;
        int capacity;

        cout << "\n========== ADD SHELTER ==========\n";

        cout << "Shelter ID: ";
        cin >> id;

        cin.ignore();

        cout << "Location: ";
        getline(cin, location);

        cout << "Capacity: ";
        cin >> capacity;

        Shelter shelter(id, location, capacity);

        shelters.push_back(shelter);

        cout << "\nShelter added successfully.\n";
    }

    void showShelters()
    {
        if (shelters.empty())
        {
            cout << "\nNo shelters available.\n";
            return;
        }

        cout << "\n========== SHELTERS ==========\n";

        for (auto &shelter : shelters)
        {
            shelter.display();
        }
    }

    void addResource()
    {
        int id;
        string name;
        int quantity;

        cout << "\n========== ADD RESOURCE ==========\n";

        cout << "Resource ID: ";
        cin >> id;

        cin.ignore();

        cout << "Resource Name: ";
        getline(cin, name);

        cout << "Quantity: ";
        cin >> quantity;

        Resource resource(id, name, quantity);

        resources.push_back(resource);

        cout << "\nResource added successfully.\n";
    }

    void showResources()
    {
        if (resources.empty())
        {
            cout << "\nNo resources available.\n";
            return;
        }

        cout << "\n========== RESOURCES ==========\n";

        for (auto &resource : resources)
        {
            resource.display();
        }
    }

    void addRoad()
    {
        string from;
        string to;
        int distance;

        cout << "\n========== ADD ROAD ==========\n";

        cin.ignore();

        cout << "From Location: ";
        getline(cin, from);

        cout << "To Location: ";
        getline(cin, to);

        cout << "Distance (km): ";
        cin >> distance;

        routeManager.addRoad(from, to, distance);
    }

    void showRoads()
    {
        routeManager.displayRoutes();
    }

    void findRoute()
    {
        string start;
        string destination;

        cout << "\n========== FIND SHORTEST ROUTE ==========\n";

        cin.ignore();

        cout << "Start Location: ";
        getline(cin, start);

        cout << "Destination: ";
        getline(cin, destination);

        routeManager.findShortestRoute(start, destination);
    }

    void menu()
    {
        int choice;

        do
        {
            cout << "\n\n========================================";
            cout << "\n           GARUDARESQ";
            cout << "\n========================================";

            cout << "\n1. Report Emergency";
            cout << "\n2. Show Emergency Queue";
            cout << "\n3. Process Highest Priority Emergency";
            cout << "\n4. Add Rescue Team";
            cout << "\n5. Show Rescue Teams";
            cout << "\n6. Add Shelter";
            cout << "\n7. Show Shelters";
            cout << "\n8. Add Resource";
            cout << "\n9. Show Resources";
            cout << "\n10. Add Road";
            cout << "\n11. Show Roads";
            cout << "\n12. Find Shortest Route";
            cout << "\n13. Show Emergency Linked List";
            cout << "\n14. Search Emergency";
            cout << "\n15. Sort Emergencies by Priority";
            cout << "\n16. Show Normal Emergency Queue";
            cout << "\n0. Exit";

            cout << "\n\nEnter choice: ";
            cin >> choice;

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
                    cout << "\nExiting GarudaResQ...\n";
                    break;

                default:
                    cout << "\nInvalid choice.\n";
            }

        } while (choice != 0);
    }
};

#endif // GARUDARESQ_H
