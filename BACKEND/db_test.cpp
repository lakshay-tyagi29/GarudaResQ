#include <iostream>
#include <libpq-fe.h>

using namespace std;

int main()
{
    PGconn *conn = PQconnectdb(
        "host=localhost port=5432 dbname=garudaresq user=postgres"
    );

    if (PQstatus(conn) == CONNECTION_OK)
    {
        cout << "Database Connected Successfully!";
    }
    else
    {
        cout << "Connection Failed: " << PQerrorMessage(conn);
    }

    PQfinish(conn);

    return 0;
}