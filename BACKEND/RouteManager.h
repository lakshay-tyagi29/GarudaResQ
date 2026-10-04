#ifndef ROUTEMANAGER_H
#define ROUTEMANAGER_H

#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <limits>
#include <algorithm>

using namespace std;

class RouteManager
{
private:
    unordered_map<string, vector<pair<string, int>>> graph;

public:

    void addRoad(string from, string to, int distance)
    {
        graph[from].push_back({to, distance});
        graph[to].push_back({from, distance});

        cout << "\nRoad added successfully.";
    }

    void displayRoutes()
    {
        if (graph.empty())
        {
            cout << "\nNo roads available.\n";
            return;
        }

        cout << "\n========== ROAD NETWORK ==========\n";

        for (auto &node : graph)
        {
            cout << "\n" << node.first << " -> ";

            for (auto &road : node.second)
            {
                cout << road.first
                     << " (" << road.second << " km) ";
            }

            cout << endl;
        }
    }

    void findShortestRoute(string start, string destination)
    {
        if (graph.find(start) == graph.end() ||
            graph.find(destination) == graph.end())
        {
            cout << "\nLocation not found in road network.\n";
            return;
        }

        unordered_map<string, int> distance;
        unordered_map<string, string> previous;

        for (auto &node : graph)
        {
            distance[node.first] = numeric_limits<int>::max();
        }

        priority_queue<
            pair<int, string>,
            vector<pair<int, string>>,
            greater<pair<int, string>>
        > pq;

        distance[start] = 0;

        pq.push({0, start});

        while (!pq.empty())
        {
            int currentDistance = pq.top().first;
            string currentNode = pq.top().second;

            pq.pop();

            if (currentDistance > distance[currentNode])
                continue;

            for (auto &road : graph[currentNode])
            {
                string nextNode = road.first;
                int roadDistance = road.second;

                int newDistance =
                    currentDistance + roadDistance;

                if (newDistance < distance[nextNode])
                {
                    distance[nextNode] = newDistance;
                    previous[nextNode] = currentNode;

                    pq.push({newDistance, nextNode});
                }
            }
        }

        if (distance[destination] == numeric_limits<int>::max())
        {
            cout << "\nNo route available.\n";
            return;
        }

        vector<string> path;
        string current = destination;

        while (current != start)
        {
            path.push_back(current);
            current = previous[current];
        }

        path.push_back(start);

        reverse(path.begin(), path.end());

        cout << "\n========== SHORTEST ROUTE ==========\n";

        cout << "\nRoute: ";

        for (int i = 0; i < path.size(); i++)
        {
            cout << path[i];

            if (i != path.size() - 1)
                cout << " -> ";
        }

        cout << "\nTotal Distance: "
             << distance[destination]
             << " km\n";
    }
};

#endif // ROUTEMANAGER_H
