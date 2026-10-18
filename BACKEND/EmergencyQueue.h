#ifndef EMERGENCYQUEUE_H
#define EMERGENCYQUEUE_H

#include <iostream>
#include "EmergencyRequest.h"

using namespace std;

struct QueueNode
{
    EmergencyRequest request;
    QueueNode* next;
    explicit QueueNode(const EmergencyRequest& r) : request(r), next(nullptr) {}
};

class EmergencyQueue
{
private:
    QueueNode* front;
    QueueNode* rear;

public:
    EmergencyQueue() : front(nullptr), rear(nullptr) {}

    ~EmergencyQueue() { clear(); }
    EmergencyQueue(const EmergencyQueue&) = delete;
    EmergencyQueue& operator=(const EmergencyQueue&) = delete;

    void clear()
    {
        while (front != nullptr)
        {
            QueueNode* temp = front;
            front = front->next;
            delete temp;
        }
        rear = nullptr;
    }

    bool isEmpty() const { return front == nullptr; }

    void enqueue(const EmergencyRequest& request)
    {
        QueueNode* newNode = new QueueNode(request);
        if (rear == nullptr) front = rear = newNode;
        else
        {
            rear->next = newNode;
            rear = newNode;
        }
    }

    bool dequeue()
    {
        if (isEmpty())
        {
            cout << "\nQueue is empty.\n";
            return false;
        }
        QueueNode* temp = front;
        front = front->next;
        if (front == nullptr) rear = nullptr;
        delete temp;
        return true;
    }

    bool removeByID(int requestID)
    {
    QueueNode* current = front;
    QueueNode* previous = nullptr;

    while (current != nullptr)
    {
        if (current->request.getRequestID() == requestID)
        {
            if (previous == nullptr)
            {
                front = current->next;
            }
            else
            {
                previous->next = current->next;
            }

            if (current == rear)
            {
                rear = previous;
            }

            delete current;
            return true;
        }

        previous = current;
        current = current->next;
    }

    return false;
    }

    void displayQueue() const
    {
        if (isEmpty())
        {
            cout << "\nQueue is empty.\n";
            return;
        }
        cout << "\n========== EMERGENCY QUEUE (FIFO) ==========\n";
        for (QueueNode* temp = front; temp != nullptr; temp = temp->next)
        {
            cout << "\nRequest ID: " << temp->request.getRequestID()
                 << "\nVictim: " << temp->request.getVictim().getName()
                 << "\nPriority: " << temp->request.getPriority()
                 << "\n-----------------------------------\n";
        }
        cout << endl;
    }
};

#endif 
