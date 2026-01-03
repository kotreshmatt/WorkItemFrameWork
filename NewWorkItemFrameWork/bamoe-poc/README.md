# IBM BAMOE POC Project

This proof-of-concept project demonstrates three key capabilities of IBM Business Automation Manager Open Editions (BAMOE) using Kogito and Quarkus:

1. **Stateful Workflows**: `order-process.bpmn2`
2. **Subprocesses**: `validate-order.bpmn2`
3. **Stateless Workflows with REST Integration**: `fetch-customer-data.bpmn2`

## Project Structure

- `src/main/resources/bpmn/`: Contains the BPMN 2.0 workflow definitions.
- `src/main/java/com/example/bamoe/model/`: Java data classes (Order, Customer).
- `src/main/java/com/example/bamoe/service/`: Services including the REST client simulator.

## Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL (for stateful workflow persistence)

## Persistence Setup

This project uses PostgreSQL for stateful workflow persistence. Ensure you have a database named `bamoe_poc` running on `localhost:5432` with user `postgres` and password `postgres` (configurable in `src/main/resources/application.properties`).

## Running the Application

1. Start the Quarkus development server:
   ```bash
   mvn quarkus:dev
   ```

2. Access the Swagger UI to test the endpoints:
   Open `http://localhost:8080/swagger-ui` in your browser.

## Testing the Workflows

### 1. Stateless Workflow (Fetch Customer)
Send a POST request to `/fetch-customer-data` with:
```json
{
  "customerId": "123"
}
```

### 2. Stateful Workflow (Order Process)
Send a POST request to `/order-process` to start a new instance:
```json
{
  "order": {
    "id": "ORD-001",
    "customerId": "123",
    "amount": 100.0
  }
}
```
This will automatically trigger the `validate-order` subprocess.

## Key Concepts Demonstrated

- **Microservices Architecture**: Each process is compiled into the application code.
- **REST Integration**: Seamlessly calling external services via MicroProfile REST Client.
- **Persistence**: Automatic state persistence using PostgreSQL.
- **Modularity**: Reusing logic via subprocesses.
