# Chat API

Chat API is a Node.js-based chat application API built with NestJS, uWebsockets.js, PostgreSQL, Prisma ORM, S3, Postgres.js, and Coturn. It provides the backend infrastructure for a real-time chat application.

## Prerequisites

Make sure you have the Docker and Node.js installed on your machine:

## Getting Started

To run the chat application API locally, follow these steps:

1. Clone the repository:

   ```
   git clone https://github.com/IbrahimAlKhalil/chat-api.git
   ```

2. Navigate to the project root directory:

   ```
   cd chat-api
   ```

3. Create a `.env` file based on the provided `.env.example` file and update the configuration according to your environment.

4. Run the start script to automatically pull necessary Docker images and start the API:

   ```
   ./start.mjs
   ```

5. The API server should now be running locally. You can access it via `http://localhost:7000`.

## Examples

The `examples` directory contains an example application that demonstrates how to use the Chat API. To run the example app, follow these steps:

1. Navigate to the `examples` directory:

   ```
   cd examples
   ```

2. Run the server script:

   ```
   ./server.js
   ```

3. The example application should now be running and accessible at `http://localhost:7005`.

## License

Chat API is open-source and released under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the codebase as per the terms of the license.

## Contact

If you have any questions or need further assistance, feel free to contact the project maintainer at hm.ibrahimalkhalil@gmail.com.