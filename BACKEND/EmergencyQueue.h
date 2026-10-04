#ifndef EMERGENCYQUEUE_H
#define EMERGENCYQUEUE_H

#include <iostream>
#include "EmergencyRequest.h"

using namespace std;

struct QueueNode
{
    EmergencyRequest request;
    QueueNode* next;

    QueueNode(EmergencyRequest r)
        : request(r), next(nullptr)
    {
    }
};

class EmergencyQueue
{
private:
    QueueNode* front;
    QueueNode* rear;

public:

    EmergencyQueue()
    {
        front = nullptr;
        rear = nullptr;
    }

    bool isEmpty() const
    {
        return front == nullptr;
    }

    void enqueue(EmergencyRequest request)
    {
        QueueNode* newNode = new QueueNode(request);

        if (rear == nullptr)
        {
            front = rear = newNode;
            return;
        }

        rear->next = newNode;
        rear = newNode;
    }

    void dequeue()
    {
        if (isEmpty())
        {
            cout << "\nQueue is empty.\n";
            return;
        }

        QueueNode* temp = front;

        front = front->next;

        if (front == nullptr)
        {
            rear = nullptr;
        }

        delete temp;

        cout << "\nEmergency removed from queue.\n";
    }

    void displayQueue()
    {
        if (isEmpty())
        {
            cout << "\nQueue is empty.\n";
            return;
        }

        QueueNode* temp = front;

        cout << "\n========== EMERGENCY QUEUE ==========\n";

        while (temp != nullptr)
        {
            cout << "\nRequest ID: "
                 << temp->request.getRequestID();

            cout << "\nVictim: "
                 << temp->request.getVictim().getName();

            cout << "\nPriority: "
                 << temp->request.getPriority();

            cout << "\n-----------------------------------";

            temp = temp->next;
        }

        cout << endl;
    }
};

#endif // EMERGENCYQUEUE_H
