#ifndef EMERGENCYLIST_H
#define EMERGENCYLIST_H

#include <iostream>
#include "EmergencyRequest.h"

using namespace std;

struct EmergencyNode
{
    EmergencyRequest request;
    EmergencyNode* next;

    explicit EmergencyNode(const EmergencyRequest& r)
        : request(r), next(nullptr) {}
};

class EmergencyList
{
private:
    EmergencyNode* head;
    EmergencyNode* tail;

public:
    EmergencyList() : head(nullptr), tail(nullptr) {}

    ~EmergencyList()
    {
        clear();
    }

    EmergencyList(const EmergencyList&) = delete;
    EmergencyList& operator=(const EmergencyList&) = delete;

    void clear()
    {
        while (head != nullptr)
        {
            EmergencyNode* temp = head;
            head = head->next;
            delete temp;
        }
        tail = nullptr;
    }

    bool isEmpty() const { return head == nullptr; }

    bool containsRequestID(int requestID) const
    {
        for (EmergencyNode* temp = head; temp != nullptr; temp = temp->next)
            if (temp->request.getRequestID() == requestID) return true;
        return false;
    }

    void addEmergency(const EmergencyRequest& request)
    {
        if (containsRequestID(request.getRequestID()))
        {
            cout << "\nDuplicate Request ID. Emergency was not added to linked list.\n";
            return;
        }

        EmergencyNode* newNode = new EmergencyNode(request);
        if (head == nullptr) head = tail = newNode;
        else
        {
            tail->next = newNode;
            tail = newNode;
        }
    }

    bool markProcessed(int requestID)
    {
        for (EmergencyNode* temp = head; temp != nullptr; temp = temp->next)
        {
            if (temp->request.getRequestID() == requestID)
            {
                temp->request.markProcessed();
                return true;
            }
        }
        return false;
    }

    void displayEmergencies() const
    {
        if (isEmpty())
        {
            cout << "\nNo emergencies in linked list.\n";
            return;
        }

        cout << "\n========== EMERGENCY LINKED LIST ==========\n";
        for (EmergencyNode* temp = head; temp != nullptr; temp = temp->next)
        {
            cout << "\nRequest ID: " << temp->request.getRequestID()
                 << "\nVictim: " << temp->request.getVictim().getName()
                 << "\nLocation: " << temp->request.getVictim().getLocation()
                 << "\nPriority: " << temp->request.getPriority()
                 << "\nStatus: " << (temp->request.isProcessed() ? "Processed" : "Pending")
                 << "\n-----------------------------------";
        }
        cout << endl;
    }

    bool searchEmergency(int requestID) const
    {
        for (EmergencyNode* temp = head; temp != nullptr; temp = temp->next)
        {
            if (temp->request.getRequestID() == requestID)
            {
                cout << "\n========== EMERGENCY FOUND ==========\n";
                temp->request.display();
                cout << "\n=====================================\n";
                return true;
            }
        }
        cout << "\nEmergency with Request ID " << requestID << " not found.\n";
        return false;
    }

    void sortByPriority()
    {
        if (head == nullptr || head->next == nullptr)
        {
            cout << "\nNot enough emergencies to sort.\n";
            return;
        }

        bool swapped;
        do
        {
            swapped = false;
            EmergencyNode* current = head;
            while (current->next != nullptr)
            {
                if (current->request.getPriority() < current->next->request.getPriority())
                {
                    EmergencyRequest temporary = current->request;
                    current->request = current->next->request;
                    current->next->request = temporary;
                    swapped = true;
                }
                current = current->next;
            }
        } while (swapped);

        cout << "\nEmergencies sorted by priority successfully.\n";
    }
};

#endif 
