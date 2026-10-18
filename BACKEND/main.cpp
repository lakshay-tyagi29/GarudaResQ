#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
#include <string>
#include <climits>
#include <cstdlib>

#include "AuthManager.h"
#include "Victim.h"
#include "EmergencyRequest.h"
#include "EmergencyList.h"
#include "EmergencyQueue.h"
#include "PriorityManager.h"
#include "RescueTeam.h"
#include "Resource.h"
#include "Shelter.h"
#include "RouteManager.h"
#include "GarudaResQ.h"

void runCitizenPortal(GarudaResQ &resq, AuthManager &auth)
{
    User citizen = auth.registerCitizen();
    int choice = 0;

    do
    {
        std::cout << "\n=========================================\n"
                  << "       CITIZEN PORTAL (" << citizen.username << ")\n"
                  << "=========================================\n"
                  << "1. Report New Emergency Request\n"
                  << "2. View Nearby Shelters\n"
                  << "3. Search Emergency Request Status\n"
                  << "4. Logout to Main Portal\n"
                  << "Enter Choice: ";
        std::cin >> choice;

        switch (choice)
        {
        case 1:
            resq.reportEmergency();
            break;
        case 2:
            resq.showShelters();
            break;
        case 3:
            resq.searchEmergency();
            break;
        case 4:
            break;
        default:
            std::cout << "\n[-] Invalid Choice! Try again.\n";
            break;
        }
    } while (choice != 4);
}

void runNGOPortal(GarudaResQ &resq, AuthManager &auth)
{
    int subChoice = 0;
    std::cout << "\n-----------------------------------------\n"
              << "1. Official NGO Login\n2. Register New NGO Worker\nEnter Choice: ";
    std::cin >> subChoice;

    if (subChoice == 2)
    {
        auth.registerOfficial(NGO);
    }

    User ngoUser = auth.loginOfficial(NGO);
    if (ngoUser.role != NGO)
        return;

    int choice = 0;
    do
    {
        std::cout << "\n=========================================\n"
                  << "          NGO DASHBOARD (" << ngoUser.username << ")\n"
                  << "=========================================\n"
                  << "1. View Active Priority Emergency Requests\n"
                  << "2. Process Highest Priority Emergency\n"
                  << "3. View All Emergency Records (Linked List)\n"
                  << "4. Search Emergency Request by ID\n"
                  << "5. Add Rescue Team\n"
                  << "6. View Active Rescue Teams Status\n"
                  << "7. Add Road Route\n"
                  << "8. Show Road Routes\n"
                  << "9. Find Shortest Route\n"
                  << "10. Logout to Main Portal\n"
                  << "Enter Choice: ";
        std::cin >> choice;

        switch (choice)
        {
        case 1:
            resq.showEmergencies();
            break;
        case 2:
            resq.processEmergency();
            break;
        case 3:
            resq.showEmergencyList();
            break;
        case 4:
            resq.searchEmergency();
            break;
        case 5:
            resq.addRescueTeam();
            break;
        case 6:
            resq.showRescueTeams();
            break;
        case 7:
            resq.addRoad();
            break;
        case 8:
            resq.showRoads();
            break;
        case 9:
            resq.findRoute();
            break;
        case 10:
            break;
        default:
            std::cout << "\n[-] Invalid Choice! Try again.\n";
            break;
        }
    } while (choice != 10);
}

void runShelterPortal(GarudaResQ &resq, AuthManager &auth)
{
    int subChoice = 0;
    std::cout << "\n-----------------------------------------\n"
              << "1. Official Shelter Login\n2. Register New Shelter Admin\nEnter Choice: ";
    std::cin >> subChoice;

    if (subChoice == 2)
    {
        auth.registerOfficial(SHELTER);
    }

    User shelterUser = auth.loginOfficial(SHELTER);
    if (shelterUser.role != SHELTER)
        return;

    int choice = 0;
    do
    {
        std::cout << "\n=========================================\n"
                  << "       SHELTER DASHBOARD (" << shelterUser.username << ")\n"
                  << "=========================================\n"
                  << "1. View All Shelters Capacity Status\n"
                  << "2. Add New Shelter\n"
                  << "3. Update Shelter Details\n"
                  << "4. Assign People / Occupancy to Shelter\n"
                  << "5. Add Resource Inventory\n"
                  << "6. View Resources Inventory\n"
                  << "7. Distribute Resource\n"
                  << "8. Logout to Main Portal\n"
                  << "Enter Choice: ";
        std::cin >> choice;

        switch (choice)
        {
        case 1:
            resq.showShelters();
            break;
        case 2:
            resq.addShelter();
            break;
        case 3:
            resq.updateShelter();
            break;
        case 4:
            resq.assignPeopleToShelter();
            break;
        case 5:
            resq.addResource();
            break;
        case 6:
            resq.showResources();
            break;
        case 7:
            resq.distributeResource();
            break;
        case 8:
            break;
        default:
            std::cout << "\n[-] Invalid Choice! Try again.\n";
            break;
        }
    } while (choice != 8);
}

int main()
{
    AuthManager auth;
    GarudaResQ resq;

    int mainChoice = 0;
    while (true)
    {
        std::cout << "\n=========================================\n"
                  << "       GARUDARESQ        \n"
                  << "=========================================\n"
                  << "1. Citizen Portal\n"
                  << "2. NGO Portal\n"
                  << "3. Shelter Admin Portal\n"
                  << "4. Exit System\n"
                  << "Select Access Portal: ";
        std::cin >> mainChoice;

        switch (mainChoice)
        {
        case 1:
            runCitizenPortal(resq, auth);
            break;
        case 2:
            runNGOPortal(resq, auth);
            break;
        case 3:
            runShelterPortal(resq, auth);
            break;
        case 4:
            std::cout << "\nShutting down GarudaResQ backend system. Stay Safe!\n";
            return 0;
        default:
            std::cout << "\n[-] Invalid Choice! Please select between 1 and 4.\n";
            break;
        }
    }
    return 0;
}
