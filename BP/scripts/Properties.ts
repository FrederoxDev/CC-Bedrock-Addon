import { MinecraftEntityTypes, WorldInitializeEvent, PropertyRegistry, DynamicPropertiesDefinition, EntityTypes } from "@minecraft/server";

export const connectedTurtleProp = "connectedTurtle";
export const turtleFilesProp = "turtleFiles";
export const turtleIdProp = "turtleId";
export const nextTurtleIdProp = "nextTurtleId";

export const InitializeProperties = (e: WorldInitializeEvent) => {
    const propertyRegistry = e.propertyRegistry;
    const playerType = MinecraftEntityTypes.player
    const playerData = new DynamicPropertiesDefinition();
    playerData.defineNumber(connectedTurtleProp);
    propertyRegistry.registerEntityTypeDynamicProperties(playerData, playerType);

    const turtleType = EntityTypes.get("coslang:turtle_controller");
    const turtleData = new DynamicPropertiesDefinition();
    turtleData.defineString(turtleFilesProp, 4294967295);
    turtleData.defineNumber(turtleIdProp);
    propertyRegistry.registerEntityTypeDynamicProperties(turtleData, turtleType);

    const worldData = new DynamicPropertiesDefinition();
    worldData.defineNumber(nextTurtleIdProp);
    propertyRegistry.registerWorldDynamicProperties(worldData);
}