#include <iostream>
#include "Database.h"

using namespace std;

int main()
{
    Database db;

    if (db.connect())
    {
        bool success = db.insertEmergencyRequest(
            "1002",
            2,
            "Ansh gupta",
            "Dehradun",
            "Flood",
            "critical",
            90,
            3,
            "Emergency flood rescue required",
            "9876543210"
        );

        if (success)
        {
            cout << "\nEmergency Request Test Successful!";
        }
    }

    return 0;
}