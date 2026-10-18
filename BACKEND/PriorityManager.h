#ifndef PRIORITYMANAGER_H
#define PRIORITYMANAGER_H

#include <iostream>
#include <queue>
#include <vector>
#include "EmergencyRequest.h"

using namespace std;

class PriorityManager
{
private:
    priority_queue<
        EmergencyRequest,
        vector<EmergencyRequest>,
        ComparePriority
    > emergencyQueue;

public:

    void addEmergency(EmergencyRequest request)
    {
        emergencyQueue.push(request);

        cout << "\nEmergency added successfully.";
        cout << "\nPriority assigned: "
             << request.getPriority() << endl;
    }

    bool isEmpty() const
    {
        return emergencyQueue.empty();
    }

    EmergencyRequest getHighestPriority() const
    {
        return emergencyQueue.top();
    }

    bool removeHighestPriority()
    {
        if (emergencyQueue.empty()) return false;
        emergencyQueue.pop();
        return true;
    }

    void processHighestPriority()
    {
        if (emergencyQueue.empty())
        {
            cout << "\nNo pending emergency requests.\n";
            return;
        }

        EmergencyRequest request = emergencyQueue.top();

        emergencyQueue.pop();

        cout << "\n===== HIGHEST PRIORITY EMERGENCY =====\n";

        request.display();

        cout << "\nRescue team should handle this request first.\n";
    }

    void displayQueue()
    {
    if (emergencyQueue.empty())
    {
        std::cout << "\nNo pending emergencies.\n";
        return;
    }

    auto temp = emergencyQueue;

    std::cout << "\n========== PRIORITY QUEUE ==========\n";

    while (!temp.empty())
    {
        const auto &request = temp.top();
        const auto &victim = request.getVictim();

        std::cout << "\nRequest ID: " << request.getRequestID()
                  << "\nVictim: " << victim.getName()
                  << "\nLocation: " << victim.getLocation()
                  << "\nPriority: " << request.getPriority()
                  << "\n-----------------------------------";

        temp.pop();
    }

    std::cout << std::endl;
    }
};

#endif 
