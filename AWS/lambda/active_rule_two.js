import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configuración del cliente IoT Data Plane
const iotDataClient = new IoTDataPlaneClient({
    region: "us-east-2", // Cambia esto a tu región
});

// Configuración del cliente DynamoDB
const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});

export const handler = async (event) => {
    console.log("Evento recibido:", JSON.stringify(event, null, 2));

    // Extraer datos del evento
    const { lpg, co, smoke, object_name, timestamp = Date.now() } = event;

    // Validar que los datos necesarios están presentes
    if (!object_name) {
        console.error("El nombre del objeto es requerido.");
        return {
            statusCode: 400,
            body: "El nombre del objeto es requerido.",
        };
    }

    if (lpg === undefined || co === undefined || smoke === undefined) {
        console.error("Los datos de lpg, co, y smoke son requeridos.");
        return {
            statusCode: 400,
            body: "Los datos de lpg, co, y smoke son requeridos.",
        };
    }

    // Evaluar condiciones para activar el conveyor
    let desiredState = {};
    let conveyorStatus = "running";
    if (lpg > 150 || co > 150 || smoke > 150) {
        desiredState.conveyor = "stopped";
        conveyorStatus = "stopped";
        console.log(`Conveyor detenido para ${object_name}.`);
    } 

    // Construir el payload para actualizar el Shadow Document
    const payload = {
        state: {
            desired: desiredState,
        },
    };

    const topic = `$aws/things/${object_name}/shadow/update`;

    // Publicar al Shadow Document
    try {
        const response = await iotDataClient.send(
            new PublishCommand({
                topic: topic,
                payload: Buffer.from(JSON.stringify(payload)),
            })
        );
        console.log(`Shadow actualizado para ${object_name}:`, JSON.stringify(payload, null, 2));
        console.log("Respuesta del cliente IoT:", response);
    } catch (error) {
        console.error("Error al actualizar el shadow:", error);
        return {
            statusCode: 500,
            body: "Error al actualizar el shadow.",
        };
    }

    // Guardar los datos en DynamoDB
    const command = new PutCommand({
        TableName: "gas_monitor_data_R2", // Cambia al nombre de tu tabla
        Item: {
            thing_name: object_name,
            timestamp: timestamp,
            lpg: lpg,
            co: co,
            smoke: smoke,
            conveyor_status: conveyorStatus, // Estado actual del conveyor
        },
    });

    try {
        const dynamoResponse = await docClient.send(command);
        console.log("Datos guardados en DynamoDB:", dynamoResponse);
    } catch (error) {
        console.error("Error al guardar datos en DynamoDB:", error);
        return {
            statusCode: 500,
            body: "Error al guardar datos en DynamoDB.",
        };
    }

    return {
        statusCode: 200,
        body: "Shadow actualizado y datos guardados exitosamente.",
    };
};
