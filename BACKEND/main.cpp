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

using namespace std;

void runCitizenPortal(GarudaResQ& resq, AuthManager& auth) {
    User citizen = auth.registerCitizen();
    int choice;
    do {
        cout << "\n=========================================\n";
        cout << "       CITIZEN PORTAL (" << citizen.username << ")\n";
        cout << "=========================================\n";
        cout << "1. Report New Emergency Request\n";
        cout << "2. View Nearby Shelters\n";
        cout << "3. Search Emergency Request Status\n";
        cout << "4. Logout to Main Portal\n";
        cout << "Enter Choice: ";
        cin >> choice;

        if (choice == 1) {
            resq.reportEmergency();
        }
        else if (choice == 2) {
            resq.showShelters();
        }
        else if (choice == 3) {
            resq.searchEmergency();
        }
    } while (choice != 4);
}

void runNGOPortal(GarudaResQ& resq, AuthManager& auth) {
    int subChoice;
    cout << "\n-----------------------------------------\n";
    cout << "1. Official NGO Login\n2. Register New NGO Worker\nEnter Choice: ";
    cin >> subChoice;

    if (subChoice == 2) {
        auth.registerOfficial(NGO);
    }

    User ngoUser = auth.loginOfficial(NGO);
    if (ngoUser.role != NGO) return;

    int choice;
    do {
        cout << "\n=========================================\n";
        cout << "          NGO DASHBOARD (" << ngoUser.username << ")\n";
        cout << "=========================================\n";
        cout << "1. View Active Priority Emergency Requests\n";
        cout << "2. Process Highest Priority Emergency\n";
        cout << "3. View All Emergency Records (Linked List)\n";
        cout << "4. Search Emergency Request by ID\n";
        cout << "5. Add Rescue Team\n";
        cout << "6. View Active Rescue Teams Status\n";
        cout << "7. Add Road Route\n";
        cout << "8. Show Road Routes\n";
        cout << "9. Find Shortest Route\n";
        cout << "10. Logout to Main Portal\n";
        cout << "Enter Choice: ";
        cin >> choice;

        if (choice == 1) {
            resq.showEmergencies();
        }
        else if (choice == 2) {
            resq.processEmergency();
        }
        else if (choice == 3) {
            resq.showEmergencyList();
        }
        else if (choice == 4) {
            resq.searchEmergency();
        }
        else if (choice == 5) {
            resq.addRescueTeam();
        }
        else if (choice == 6) {
            resq.showRescueTeams();
        }
        else if (choice == 7) {
            resq.addRoad();
        }
        else if (choice == 8) {
            resq.showRoads();
        }
        else if (choice == 9) {
            resq.findRoute();
        }
    } while (choice != 10);
}

void runShelterPortal(GarudaResQ& resq, AuthManager& auth) {
    int subChoice;
    cout << "\n-----------------------------------------\n";
    cout << "1. Official Shelter Login\n2. Register New Shelter Admin\nEnter Choice: ";
    cin >> subChoice;

    if (subChoice == 2) {
        auth.registerOfficial(SHELTER);
    }

    User shelterUser = auth.loginOfficial(SHELTER);
    if (shelterUser.role != SHELTER) return;

    int choice;
    do {
        cout << "\n=========================================\n";
        cout << "       SHELTER DASHBOARD (" << shelterUser.username << ")\n";
        cout << "=========================================\n";
        cout << "1. View All Shelters Capacity Status\n";
        cout << "2. Add New Shelter\n";
        cout << "3. Add Resource Inventory\n";
        cout << "4. View Resources Inventory\n";
        cout << "5. Logout to Main Portal\n";
        cout << "Enter Choice: ";
        cin >> choice;

        if (choice == 1) {
            resq.showShelters();
        }
        else if (choice == 2) {
            resq.addShelter();
        }
        else if (choice == 3) {
            resq.addResource();
        }
        else if (choice == 4) {
            resq.showResources();
        }
    } while (choice != 5);
}

int main() {
    AuthManager auth;
    GarudaResQ resq;

    int mainChoice;
    while (true) {
        cout << "\n=========================================\n";
        cout << "       GARUDA RESQ BACKEND ENGINE        \n";
        cout << "=========================================\n";
        cout << "1. Citizen Portal\n";
        cout << "2. NGO Portal\n";
        cout << "3. Shelter Admin Portal\n";
        cout << "4. Exit System\n";
        cout << "Select Access Portal: ";
        cin >> mainChoice;

        switch (mainChoice) {
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
                cout << "\nShutting down GarudaResQ backend system. Stay Safe!\n";
                return 0;
            default:
                cout << "\n[-] Invalid Choice! Please select between 1 and 4.\n";
        }
    }
    return 0;
}