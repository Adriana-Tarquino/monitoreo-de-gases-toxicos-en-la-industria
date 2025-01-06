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
    const {
        timestamp = Date.now(),
        object_name = "default_object",
        sn = "default_sn",
        temperature = null,
        humidity = null,
        lpg = null,
        co = null,
        smoke = null,
    } = event;

    // Validación de datos esenciales
    if (!object_name || !sn) {
        console.error("Faltan datos esenciales: object_name o sn están ausentes.");
        return { statusCode: 400, body: "Datos insuficientes para procesar el evento." };
    }

    const desiredState = {};

    // Evaluar condiciones para el ventilador
    if (temperature !== null && humidity !== null) {
        if (temperature > 35 || humidity > 40) {
            desiredState.fan = true; // Activar el ventilador
            console.log(`Activando ventilador para ${object_name}.`);
        } else {
            desiredState.fan = false; // Desactivar el ventilador
            console.log(`Desactivando ventilador para ${object_name}.`);
        }
    }

    // Evaluar condiciones para la alarma
    if (lpg !== null && co !== null && smoke !== null) {
        if (lpg > 150 || co > 150 || smoke > 100) {
            desiredState.alarm = true; // Activar la alarma
            console.log(`Activando alarma para ${object_name}.`);
        } else {
            desiredState.alarm = false; // Desactivar la alarma
            console.log(`Desactivando alarma para ${object_name}.`);
        }
    }

    // Si no se han definido cambios en el estado deseado, registrar advertencia
    if (Object.keys(desiredState).length === 0) {
        console.warn("No se han definido cambios en el estado deseado.");
    }

    // Publicar cambios al Shadow Document
    const payload = {
        state: {
            desired: desiredState,
        },
    };
    const topic = `$aws/things/${object_name}/shadow/update`;

    try {
        const response = await iotDataClient.send(
            new PublishCommand({
                topic: topic,
                payload: Buffer.from(JSON.stringify(payload)),
            })
        );
        console.log(`Shadow actualizado para ${object_name}:`, JSON.stringify(payload, null, 2));
    } catch (error) {
        console.error("Error al actualizar el Shadow Document:", error);
    }

    // Almacenar el evento en DynamoDB
    const command = new PutCommand({
        TableName: "gas_monitor_data_env",
        Item: {
            thing_name: object_name,
            sn: sn,
            timestamp: timestamp,
            lpg: lpg,
            co: co,
            smoke: smoke,
            temperature: temperature,
            humidity: humidity,
            fan: desiredState.fan ?? null, // Almacenar el estado calculado del ventilador
            alarm: desiredState.alarm ?? null, // Almacenar el estado calculado de la alarma
        },
    });

    try {
        const dynamoResponse = await docClient.send(command);
        console.log("Datos guardados en DynamoDB:", dynamoResponse);
    } catch (error) {
        console.error("Error al guardar datos en DynamoDB:", error);
        return { statusCode: 500, body: "Error al guardar datos en DynamoDB." };
    }

    return {
        statusCode: 200,
        body: "Shadow actualizado y datos guardados exitosamente.",
    };
};
