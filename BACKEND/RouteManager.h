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
        if (from.empty() || to.empty() || distance < 0)
        {
            cout << "\nRoad locations must be non-empty and distance cannot be negative.\n";
            return;
        }
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

    void findShortestRoute(const std::string &start, const std::string &destination)
    {
    if (graph.find(start) == graph.end() || graph.find(destination) == graph.end())
    {
        std::cout << "\nLocation not found in road network.\n";
        return;
    }

    std::unordered_map<std::string, int> distance;
    std::unordered_map<std::string, std::string> previous;

    for (const auto &pair : graph)
    {
        distance[pair.first] = std::numeric_limits<int>::max();
    }

    std::priority_queue<
        std::pair<int, std::string>,
        std::vector<std::pair<int, std::string>>,
        std::greater<std::pair<int, std::string>>
    > pq;

    distance[start] = 0;
    pq.push({0, start});

    while (!pq.empty())
    {
        int currentDistance = pq.top().first;
        std::string currentNode = pq.top().second;
        pq.pop();

        if (currentDistance > distance[currentNode])
            continue;

        if (currentNode == destination)
            break;

        for (const auto &road : graph[currentNode])
        {
            std::string nextNode = road.first;
            int roadDistance = road.second;

            if (currentDistance > std::numeric_limits<int>::max() - roadDistance)
                continue;

            int newDistance = currentDistance + roadDistance;

            if (newDistance < distance[nextNode])
            {
                distance[nextNode] = newDistance;
                previous[nextNode] = currentNode;
                pq.push({newDistance, nextNode});
            }
        }
    }

    if (distance[destination] == std::numeric_limits<int>::max())
    {
        std::cout << "\nNo route available.\n";
        return;
    }

    std::vector<std::string> path;
    std::string current = destination;

    while (current != start)
    {
        path.push_back(current);
        auto it = previous.find(current);
        if (it == previous.end())
        {
            std::cout << "\nUnable to reconstruct route.\n";
            return;
        }
        current = it->second;
    }

    path.push_back(start);
    std::reverse(path.begin(), path.end());

    std::cout << "\n========== SHORTEST ROUTE ==========\n"
              << "\nRoute: ";

    for (size_t i = 0; i < path.size(); ++i)
    {
        std::cout << path[i];
        if (i + 1 != path.size())
            std::cout << " -> ";
    }

    std::cout << "\nTotal Distance: " << distance[destination] << " km\n";
    }
};

#endif 