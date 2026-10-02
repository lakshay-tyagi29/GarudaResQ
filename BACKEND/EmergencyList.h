#ifndef EMERGENCYLIST_H
#define EMERGENCYLIST_H

#include <iostream>
#include "EmergencyRequest.h"

using namespace std;

struct EmergencyNode
{
    EmergencyRequest request;
    EmergencyNode* next;

    EmergencyNode(EmergencyRequest r)
        : request(r), next(nullptr)
    {
    }
};

class EmergencyList
{
private:
    EmergencyNode* head;

public:

    EmergencyList()
    {
        head = nullptr;
    }

    void addEmergency(EmergencyRequest request)
    {
        EmergencyNode* newNode = new EmergencyNode(request);

        if (head == nullptr)
        {
            head = newNode;
            return;
        }

        EmergencyNode* temp = head;

        while (temp->next != nullptr)
        {
            temp = temp->next;
        }

        temp->next = newNode;
    }

    void displayEmergencies()
    {
        if (head == nullptr)
        {
            cout << "\nNo emergencies in linked list.\n";
            return;
        }

        EmergencyNode* temp = head;

        cout << "\n========== EMERGENCY LINKED LIST ==========\n";

        while (temp != nullptr)
        {
            cout << "\nRequest ID: "
                 << temp->request.getRequestID();

            cout << "\nVictim: "
                 << temp->request.getVictim().getName();

            cout << "\nLocation: "
                 << temp->request.getVictim().getLocation();

            cout << "\nPriority: "
                 << temp->request.getPriority();

            cout << "\n-----------------------------------";

            temp = temp->next;
        }

        cout << endl;
    }
    void searchEmergency(int requestID)
    {
    if (head == nullptr)
    {
        cout << "\nEmergency list is empty.\n";
        return;
    }

    EmergencyNode* temp = head;

    while (temp != nullptr)
    {
        if (temp->request.getRequestID() == requestID)
        {
            cout << "\n========== EMERGENCY FOUND ==========\n";

            cout << "\nRequest ID: "
                 << temp->request.getRequestID();

            cout << "\nVictim: "
                 << temp->request.getVictim().getName();

            cout << "\nLocation: "
                 << temp->request.getVictim().getLocation();

            cout << "\nPriority: "
                 << temp->request.getPriority();

            cout << "\n=====================================\n";

            return;
        }

        temp = temp->next;
    }

    cout << "\nEmergency with Request ID "
         << requestID
         << " not found.\n";
    }
    void sortByPriority()
   {
    if (head == nullptr || head->next == nullptr)
    {
        cout << "\nNot enough emergencies to sort.\n";
        return;
    }

    EmergencyNode* current;
    EmergencyNode* last = nullptr;

    bool swapped;

    do
    {
        swapped = false;
        current = head;

        while (current->next != last)
        {
            if (current->request.getPriority() <
                current->next->request.getPriority())
            {
                EmergencyRequest temp = current->request;

                current->request = current->next->request;
                current->next->request = temp;

                swapped = true;
            }

            current = current->next;
        }

        last = current;

    } while (swapped);

    cout << "\nEmergencies sorted by priority successfully.\n";
    }
    bool isEmpty() const
    {
        return head == nullptr;
    }
};

#endif // EMERGENCYLIST_H
