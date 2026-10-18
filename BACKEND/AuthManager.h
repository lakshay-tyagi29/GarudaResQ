#ifndef AUTH_MANAGER_H
#define AUTH_MANAGER_H

#include <iostream>
#include <string>
#include <unordered_map>
#include <limits>

using namespace std;

enum UserRole {
    CITIZEN,
    NGO,
    SHELTER,
    NONE
};

struct User {
    string username;
    string password;
    UserRole role;
    int age;
};

class AuthManager {
private:
    unordered_map<string, User> users;

public:
    AuthManager() {
        users["ngo_admin"] = {"ngo_admin", "ngo123", NGO, 0};
        users["shelter_admin"] = {"shelter_admin", "shelter123", SHELTER, 0};
    }

    User registerCitizen() {
        User u;
        u.role = CITIZEN;
        u.password = ""; 
        cout << "\n====================================\n";
        cout << "      CITIZEN IDENTIFICATION       \n";
        cout << "====================================\n";
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Enter Your Name: ";
        getline(cin, u.username);
        cout << "Enter Your Age: ";
        cin >> u.age;
        cout << "[+] Welcome Citizen " << u.username << "!\n";
        return u;
    }

    bool registerOfficial(UserRole role) {
        string uname, pwd;
        cout << "\n====================================\n";
        cout << "      OFFICIAL REGISTRATION        \n";
        cout << "====================================\n";
        cout << "Enter Username: ";
        cin >> uname;
        if (users.find(uname) != users.end()) {
            cout << "[-] Username already exists!\n";
            return false;
        }
        cout << "Enter Password: ";
        cin >> pwd;

        users[uname] = {uname, pwd, role, 0};
        cout << "[+] Registration successful! You Can login.\n";
        return true;
    }

    User loginOfficial(UserRole expectedRole) {
        string uname, pwd;
        User failedUser = {"", "", NONE, 0};

        cout << "\n====================================\n";
        cout << "           OFFICIAL LOGIN          \n";
        cout << "====================================\n";
        cout << "Enter Username: ";
        cin >> uname;
        cout << "Enter Password: ";
        cin >> pwd;

        if (users.find(uname) != users.end()) {
            User u = users[uname];
            if (u.password == pwd && u.role == expectedRole) {
                cout << "[+] Login Successful! Welcome " << uname << ".\n";
                return u;
            }
        }
        cout << "[-] Invalid credentials ya Role mismatch!\n";
        return failedUser;
    }
};

#endif
