import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";

const swaggerSpec = YAML.parse(
    fs.readFileSync("./postman/specs/soulzaa.yaml", "utf8")
);

export const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
