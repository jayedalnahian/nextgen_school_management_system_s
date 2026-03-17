import { Server } from "http";
import app from "./app.js";
import { envVars } from "./app/config/env.js";
import connectDB from "./app/utils/connectDB.js";

async function main() {
    let server: Server;

    try {
        await connectDB();
        server = app.listen(envVars.PORT, () => {
            console.log(`Server is running on port ${envVars.PORT}`);
        });
    } catch (err) {
        console.log(err);
    }
}

main();

process.on("unhandledRejection", () => {
    console.log(`😈 unhandledRejection is detected , shutting down ...`);
    process.exit(1);
});

process.on("uncaughtException", () => {
    console.log(`😈 uncaughtException is detected , shutting down ...`);
    process.exit(1);
});
