#ifndef RESOURCE_H
#define RESOURCE_H

#include <iostream>
#include <string>

using namespace std;

class Resource
{
private:
    int resourceID;
    string resourceName;
    int quantity;

public:

    Resource(int id, string name, int qty)
    {
        resourceID = id;
        resourceName = name;
        quantity = qty;
    }

    int getResourceID() const
    {
        return resourceID;
    }

    string getResourceName() const
    {
        return resourceName;
    }

    int getQuantity() const
    {
        return quantity;
    }

    void distribute(int amount)
    {
        if (amount <= quantity)
        {
            quantity -= amount;
            cout << "\nResource distributed successfully.";
        }
        else
        {
            cout << "\nNot enough resource available.";
        }
    }

    void display() const
    {
        cout << "\n----------------------------------------";
        cout << "\nResource ID   : " << resourceID;
        cout << "\nResource Name : " << resourceName;
        cout << "\nQuantity      : " << quantity;
        cout << "\n----------------------------------------\n";
    }
};

#endif // RESOURCE_H
