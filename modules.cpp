#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <unordered_map>
#include <limits>
#include <algorithm>

using namespace std;

// ============================================================
// GARUDARESQ - DISASTER RESPONSE SYSTEM
// ============================================================
// Modules:
// 1. Emergency Reporting
// 2. Priority Management
// 3. Rescue Team Management
// 4. Shelter Management
// 5. Resource Management
// 6. Route Finding
// ============================================================


// ============================================================
// MODULE 1: USER / VICTIM
// ============================================================

class Victim {
private:
    int victimID;
    string name;
    string location;
    int peopleAffected;
    int injuryLevel;
    string disasterType;
    string requiredResource;

public:
    Victim() {}

    Victim(int id, string n, string loc, int people,
           int injury, string disaster, string resource) {

        victimID = id;
        name = n;
        location = loc;
        peopleAffected = people;
        injuryLevel = injury;
        disasterType = disaster;
        requiredResource = resource;
    }

    int getID() const {
        return victimID;
    }

    string getName() const {
        return name;
    }

    string getLocation() const {
        return location;
    }

    int getPeopleAffected() const {
        return peopleAffected;
    }

    int getInjuryLevel() const {
        return injuryLevel;
    }

    string getDisasterType() const {
        return disasterType;
    }

    string getRequiredResource() const {
        return requiredResource;
    }

    // Priority calculation for prototype
    int calculatePriority() const {

        int priority = (injuryLevel * 10) + peopleAffected;

        if (priority > 100)
            priority = 100;

        return priority;
    }

    void display() const {

        cout << "\n----------------------------------------\n";
        cout << "Victim ID        : " << victimID << endl;
        cout << "Name             : " << name << endl;
        cout << "Location         : " << location << endl;
        cout << "People Affected  : " << peopleAffected << endl;
        cout << "Injury Level     : " << injuryLevel << "/5" << endl;
        cout << "Disaster Type    : " << disasterType << endl;
        cout << "Required Resource: " << requiredResource << endl;
        cout << "Priority         : " << calculatePriority() << endl;
        cout << "----------------------------------------\n";
    }
};


// ============================================================
// MODULE 2: EMERGENCY REQUEST
// ============================================================

class EmergencyRequest {
private:
    int requestID;
    Victim victim;
    bool processed;

public:

    EmergencyRequest(int id, Victim v) {

        requestID = id;
        victim = v;
        processed = false;
    }

    int getRequestID() const {
        return requestID;
    }

    Victim getVictim() const {
        return victim;
    }

    int getPriority() const {
        return victim.calculatePriority();
    }

    bool isProcessed() const {
        return processed;
    }

    void markProcessed() {
        processed = true;
    }

    void display() const {

        cout << "\nRequest ID: " << requestID;
        cout << "\nPriority  : " << getPriority();
        cout << "\nStatus    : "
             << (processed ? "Processed" : "Pending");

        victim.display();
    }
};


// Comparator for Priority Queue
struct ComparePriority {

    bool operator()(const EmergencyRequest &a,
                    const EmergencyRequest &b) const {

        return a.getPriority() < b.getPriority();
    }
};


// ============================================================
// MODULE 3: PRIORITY MANAGEMENT
// ============================================================

class PriorityManager {

private:

    priority_queue<
        EmergencyRequest,
        vector<EmergencyRequest>,
        ComparePriority
    > emergencyQueue;

public:

    void addEmergency(EmergencyRequest request) {

        emergencyQueue.push(request);

        cout << "\nEmergency added successfully.";
        cout << "\nPriority assigned: "
             << request.getPriority() << endl;
    }

    bool isEmpty() const {

        return emergencyQueue.empty();
    }

    EmergencyRequest getHighestPriority() {

        return emergencyQueue.top();
    }

    void processHighestPriority() {

        if (emergencyQueue.empty()) {

            cout << "\nNo pending emergency requests.\n";
            return;
        }

        EmergencyRequest request = emergencyQueue.top();

        emergencyQueue.pop();

        cout << "\n===== HIGHEST PRIORITY EMERGENCY =====";

        request.display();

        cout << "\nRescue team should handle this request first.\n";
    }

    void displayQueue() {

        if (emergencyQueue.empty()) {

            cout << "\nNo pending emergencies.\n";
            return;
        }

        priority_queue<
            EmergencyRequest,
            vector<EmergencyRequest>,
            ComparePriority
        > temp = emergencyQueue;

        cout << "\n========== PRIORITY QUEUE ==========\n";

        while (!temp.empty()) {

            EmergencyRequest request = temp.top();

            cout << "\nRequest ID: "
                 << request.getRequestID();

            cout << "\nVictim: "
                 << request.getVictim().getName();

            cout << "\nLocation: "
                 << request.getVictim().getLocation();

            cout << "\nPriority: "
                 << request.getPriority();

            cout << "\n-----------------------------------";

            temp.pop();
        }

        cout << endl;
    }
};


// ============================================================
// MODULE 4: RESCUE TEAM
// ============================================================

class RescueTeam {

private:

    int teamID;
    string teamName;
    string location;
    bool available;

public:

    RescueTeam(int id, string name, string loc) {

        teamID = id;
        teamName = name;
        location = loc;
        available = true;
    }

    int getID() const {
        return teamID;
    }

    string getName() const {
        return teamName;
    }

    string getLocation() const {
        return location;
    }

    bool isAvailable() const {
        return available;
    }

    void assignTeam() {

        available = false;
    }

    void makeAvailable() {

        available = true;
    }

    void display() const {

        cout << "\n----------------------------------";
        cout << "\nTeam ID   : " << teamID;
        cout << "\nTeam Name : " << teamName;
        cout << "\nLocation  : " << location;
        cout << "\nStatus    : "
             << (available ? "Available" : "Busy");
        cout << "\n----------------------------------\n";
    }
};


// ============================================================
// MODULE 5: SHELTER MANAGEMENT
// ============================================================

class Shelter {

private:

    int shelterID;
    string location;
    int capacity;
    int occupancy;

public:

    Shelter(int id, string loc, int cap) {

        shelterID = id;
        location = loc;
        capacity = cap;
        occupancy = 0;
    }

    int getID() const {
        return shelterID;
    }

    string getLocation() const {
        return location;
    }

    int getCapacity() const {
        return capacity;
    }

    int getOccupancy() const {
        return occupancy;
    }

    int getAvailableSpace() const {

        return capacity - occupancy;
    }

    bool hasSpace(int people) const {

        return (occupancy + people <= capacity);
    }

    void addPeople(int people) {

        if (hasSpace(people)) {

            occupancy += people;

            cout << "\nPeople added to shelter.";
        }
        else {

            cout << "\nShelter does not have enough space.";
        }
    }

    void display() const {

        cout << "\n----------------------------------";
        cout << "\nShelter ID     : " << shelterID;
        cout << "\nLocation       : " << location;
        cout << "\nTotal Capacity : " << capacity;
        cout << "\nOccupied       : " << occupancy;
        cout << "\nAvailable      : " << getAvailableSpace();
        cout << "\n----------------------------------\n";
    }
};


// ============================================================
// MODULE 6: RESOURCE MANAGEMENT
// ============================================================

class Resource {

private:

    int resourceID;
    string resourceName;
    int quantity;

public:

    Resource(int id, string name, int qty) {

        resourceID = id;
        resourceName = name;
        quantity = qty;
    }

    int getID() const {
        return resourceID;
    }

    string getName() const {
        return resourceName;
    }

    int getQuantity() const {
        return quantity;
    }

    void distribute(int amount) {

        if (amount <= quantity) {

            quantity -= amount;

            cout << "\nResource distributed successfully.";
        }
        else {

            cout << "\nNot enough resource available.";
        }
    }

    void display() const {

        cout << "\n----------------------------------";
        cout << "\nResource ID : " << resourceID;
        cout << "\nName        : " << resourceName;
        cout << "\nQuantity    : " << quantity;
        cout << "\n----------------------------------\n";
    }
};


// ============================================================
// MODULE 7: ROUTE MANAGEMENT
// ============================================================

class RouteManager {

private:

    // Graph:
    // location -> (connected location, distance)

    unordered_map<
        string,
        vector<pair<string, int>>
    > graph;

public:

    void addRoad(string source,
                 string destination,
                 int distance) {

        graph[source].push_back({destination, distance});

        graph[destination].push_back({source, distance});

        cout << "\nRoad added successfully.";
    }


    void displayNetwork() {

        if (graph.empty()) {

            cout << "\nNo roads available.\n";
            return;
        }

        cout << "\n========== ROAD NETWORK ==========\n";

        for (auto &node : graph) {

            cout << node.first << " -> ";

            for (auto &edge : node.second) {

                cout << edge.first
                     << "(" << edge.second << " km) ";
            }

            cout << endl;
        }
    }


    void findShortestRoute(string source,
                           string destination) {

        if (graph.find(source) == graph.end() ||
            graph.find(destination) == graph.end()) {

            cout << "\nLocation not found in road network.\n";
            return;
        }


        unordered_map<string, int> distance;

        unordered_map<string, string> previous;


        for (auto &node : graph) {

            distance[node.first] =
                numeric_limits<int>::max();
        }


        priority_queue<
            pair<int, string>,
            vector<pair<int, string>>,
            greater<pair<int, string>>
        > pq;


        distance[source] = 0;

        pq.push({0, source});


        while (!pq.empty()) {

            auto current = pq.top();

            pq.pop();

            int currentDistance = current.first;

            string currentNode = current.second;


            if (currentDistance >
                distance[currentNode]) {

                continue;
            }


            for (auto &edge : graph[currentNode]) {

                string nextNode = edge.first;

                int weight = edge.second;


                if (distance[currentNode] + weight <
                    distance[nextNode]) {

                    distance[nextNode] =
                        distance[currentNode] + weight;

                    previous[nextNode] =
                        currentNode;

                    pq.push({
                        distance[nextNode],
                        nextNode
                    });
                }
            }
        }


        if (distance[destination] ==
            numeric_limits<int>::max()) {

            cout << "\nNo route available.\n";
            return;
        }


        vector<string> path;

        string current = destination;


        while (current != source) {

            path.push_back(current);

            current = previous[current];
        }

        path.push_back(source);


        reverse(path.begin(), path.end());


        cout << "\n========== SHORTEST ROUTE ==========\n";

        for (size_t i = 0; i < path.size(); i++) {

            cout << path[i];

            if (i != path.size() - 1)
                cout << " -> ";
        }

        cout << "\nTotal Distance: "
             << distance[destination]
             << " km\n";
    }
};


// ============================================================
// MAIN SYSTEM
// ============================================================

class GarudaResQ {

private:

    PriorityManager priorityManager;

    vector<RescueTeam> rescueTeams;

    vector<Shelter> shelters;

    vector<Resource> resources;

    RouteManager routeManager;


    int nextRequestID = 1;
    int nextTeamID = 1;
    int nextShelterID = 1;
    int nextResourceID = 1;


public:


    // ========================================================
    // EMERGENCY REPORTING
    // ========================================================

    void reportEmergency() {

        int victimID;
        string name;
        string location;
        int people;
        int injury;
        string disaster;
        string resource;


        cout << "\n========== REPORT EMERGENCY ==========\n";


        cout << "Enter Victim ID: ";
        cin >> victimID;

        cin.ignore();


        cout << "Enter Name: ";
        getline(cin, name);


        cout << "Enter Current Location: ";
        getline(cin, location);


        cout << "Enter Number of People Affected: ";
        cin >> people;


        do {

            cout << "Enter Injury Level (1-5): ";
            cin >> injury;

            if (injury < 1 || injury > 5)
                cout << "Please enter a value between 1 and 5.\n";

        } while (injury < 1 || injury > 5);


        cin.ignore();


        cout << "Enter Disaster Type: ";
        getline(cin, disaster);


        cout << "Enter Required Resource: ";
        getline(cin, resource);


        Victim victim(
            victimID,
            name,
            location,
            people,
            injury,
            disaster,
            resource
        );


        EmergencyRequest request(
            nextRequestID++,
            victim
        );


        priorityManager.addEmergency(request);
    }


    // ========================================================
    // VIEW EMERGENCIES
    // ========================================================

    void viewEmergencies() {

        priorityManager.displayQueue();
    }


    // ========================================================
    // PROCESS EMERGENCY
    // ========================================================

    void processEmergency() {

        priorityManager.processHighestPriority();
    }


    // ========================================================
    // RESCUE TEAM
    // ========================================================

    void registerRescueTeam() {

        string name;
        string location;


        cin.ignore();


        cout << "\n========== REGISTER RESCUE TEAM ==========\n";


        cout << "Enter Team Name: ";
        getline(cin, name);


        cout << "Enter Team Location: ";
        getline(cin, location);


        RescueTeam team(
            nextTeamID++,
            name,
            location
        );


        rescueTeams.push_back(team);


        cout << "\nRescue team registered successfully.\n";
    }


    void viewRescueTeams() {

        if (rescueTeams.empty()) {

            cout << "\nNo rescue teams registered.\n";
            return;
        }


        cout << "\n========== RESCUE TEAMS ==========\n";


        for (auto &team : rescueTeams) {

            team.display();
        }
    }


    // ========================================================
    // SHELTER
    // ========================================================

    void addShelter() {

        string location;
        int capacity;


        cin.ignore();


        cout << "\n========== ADD SHELTER ==========\n";


        cout << "Enter Shelter Location: ";
        getline(cin, location);


        cout << "Enter Shelter Capacity: ";
        cin >> capacity;


        Shelter shelter(
            nextShelterID++,
            location,
            capacity
        );


        shelters.push_back(shelter);


        cout << "\nShelter added successfully.\n";
    }


    void viewShelters() {

        if (shelters.empty()) {

            cout << "\nNo shelters available.\n";
            return;
        }


        cout << "\n========== SHELTERS ==========\n";


        for (auto &shelter : shelters) {

            shelter.display();
        }
    }


    void findShelter() {

        int people;


        cout << "\nEnter number of people requiring shelter: ";
        cin >> people;


        bool found = false;


        cout << "\n========== AVAILABLE SHELTERS ==========\n";


        for (auto &shelter : shelters) {

            if (shelter.hasSpace(people)) {

                shelter.display();

                found = true;
            }
        }


        if (!found) {

            cout << "\nNo shelter has enough available space.\n";
        }
    }


    void allocateShelter() {

        int shelterID;
        int people;


        cout << "\nEnter Shelter ID: ";
        cin >> shelterID;


        cout << "Enter Number of People: ";
        cin >> people;


        for (auto &shelter : shelters) {

            if (shelter.getID() == shelterID) {

                shelter.addPeople(people);

                return;
            }
        }


        cout << "\nShelter not found.\n";
    }


    // ========================================================
    // RESOURCE
    // ========================================================

    void addResource() {

        string name;
        int quantity;


        cin.ignore();


        cout << "\n========== ADD RESOURCE ==========\n";


        cout << "Enter Resource Name: ";
        getline(cin, name);


        cout << "Enter Quantity: ";
        cin >> quantity;


        Resource resource(
            nextResourceID++,
            name,
            quantity
        );


        resources.push_back(resource);


        cout << "\nResource added successfully.\n";
    }


    void viewResources() {

        if (resources.empty()) {

            cout << "\nNo resources available.\n";
            return;
        }


        cout << "\n========== RESOURCES ==========\n";


        for (auto &resource : resources) {

            resource.display();
        }
    }


    void distributeResource() {

        int resourceID;
        int amount;


        cout << "\nEnter Resource ID: ";
        cin >> resourceID;


        cout << "Enter Quantity to Distribute: ";
        cin >> amount;


        for (auto &resource : resources) {

            if (resource.getID() == resourceID) {

                resource.distribute(amount);

                return;
            }
        }


        cout << "\nResource not found.\n";
    }


    // ========================================================
    // ROUTE
    // ========================================================

    void addRoad() {

        string source;
        string destination;
        int distance;


        cin.ignore();


        cout << "\n========== ADD ROAD ==========\n";


        cout << "Enter Source Location: ";
        getline(cin, source);


        cout << "Enter Destination Location: ";
        getline(cin, destination);


        cout << "Enter Distance (km): ";
        cin >> distance;


        routeManager.addRoad(
            source,
            destination,
            distance
        );
    }


    void findRoute() {

        string source;
        string destination;


        cin.ignore();


        cout << "\n========== FIND ROUTE ==========\n";


        cout << "Enter Starting Location: ";
        getline(cin, source);


        cout << "Enter Destination: ";
        getline(cin, destination);


        routeManager.findShortestRoute(
            source,
            destination
        );
    }


    void viewRoadNetwork() {

        routeManager.displayNetwork();
    }


    // ========================================================
    // MAIN MENU
    // ========================================================

    void run() {

        int choice;


        do {

            cout << "\n\n";
            cout << "============================================\n";
            cout << "        GARUDARESQ - DISASTER RESPONSE      \n";
            cout << "============================================\n";

            cout << "1.  Report Emergency\n";
            cout << "2.  View Emergency Requests\n";
            cout << "3.  Process Highest Priority Emergency\n";

            cout << "--------------------------------------------\n";

            cout << "4.  Register Rescue Team\n";
            cout << "5.  View Rescue Teams\n";

            cout << "--------------------------------------------\n";

            cout << "6.  Add Shelter\n";
            cout << "7.  View Shelters\n";
            cout << "8.  Find Available Shelter\n";
            cout << "9.  Allocate People to Shelter\n";

            cout << "--------------------------------------------\n";

            cout << "10. Add Resource\n";
            cout << "11. View Resources\n";
            cout << "12. Distribute Resource\n";

            cout << "--------------------------------------------\n";

            cout << "13. Add Road to Network\n";
            cout << "14. Find Shortest Route\n";
            cout << "15. View Road Network\n";

            cout << "--------------------------------------------\n";

            cout << "0. Exit\n";

            cout << "============================================\n";

            cout << "Enter your choice: ";
            cin >> choice;


            switch (choice) {

                case 1:
                    reportEmergency();
                    break;


                case 2:
                    viewEmergencies();
                    break;


                case 3:
                    processEmergency();
                    break;


                case 4:
                    registerRescueTeam();
                    break;


                case 5:
                    viewRescueTeams();
                    break;


                case 6:
                    addShelter();
                    break;


                case 7:
                    viewShelters();
                    break;


                case 8:
                    findShelter();
                    break;


                case 9:
                    allocateShelter();
                    break;


                case 10:
                    addResource();
                    break;


                case 11:
                    viewResources();
                    break;


                case 12:
                    distributeResource();
                    break;


                case 13:
                    addRoad();
                    break;


                case 14:
                    findRoute();
                    break;


                case 15:
                    viewRoadNetwork();
                    break;


                case 0:
                    cout << "\nExiting GarudaResQ...\n";
                    cout << "Stay Safe!\n";
                    break;


                default:
                    cout << "\nInvalid choice. Please try again.\n";
            }


        } while (choice != 0);
    }
};


// ============================================================
// MAIN FUNCTION
// ============================================================

int main() {

    GarudaResQ system;

    system.run();

    return 0;
}