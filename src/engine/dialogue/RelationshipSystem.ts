// src/engine/dialogue/RelationshipSystem.ts
import { RelationshipType } from './types';

export class RelationshipSystem {
    private static instance: RelationshipSystem;

    private constructor() {}

    public static getInstance(): RelationshipSystem {
        if (!RelationshipSystem.instance) {
            RelationshipSystem.instance = new RelationshipSystem();
        }
        return RelationshipSystem.instance;
    }

    /**
     * Determines relationship category between speaker and listener IDs
     */
    public getRelationship(charIdA: string, charIdB: string): RelationshipType {
        const idA = charIdA.toLowerCase();
        const idB = charIdB.toLowerCase();

        if (idA === idB) return RelationshipType.ALLIES;

        // Goku and Vegeta are iconic rivals
        const isGoku = idA.includes('goku') && !idA.includes('black');
        const isVegeta = idB.includes('vegeta');
        const isGokuB = idB.includes('goku') && !idB.includes('black');
        const isVegetaB = idA.includes('vegeta');

        if ((isGoku && isVegeta) || (isGokuB && isVegetaB)) {
            return RelationshipType.RIVALS;
        }

        // Frieza is historic enemy of Goku and Vegeta
        const isFrieza = idA.includes('frieza');
        const isFriezaB = idB.includes('frieza');
        if ((isFrieza && (isGokuB || isVegeta)) || (isFriezaB && (isGoku || isVegetaB))) {
            return RelationshipType.HISTORICAL_ENEMIES;
        }

        // Goku Black is historical enemy of Trunks and Goku
        const isBlack = idA.includes('black');
        const isBlackB = idB.includes('black');
        const isTrunks = idA.includes('trunks');
        const isTrunksB = idB.includes('trunks');
        if ((isBlack && (isTrunksB || isGokuB)) || (isBlackB && (isTrunks || isGoku))) {
            return RelationshipType.HISTORICAL_ENEMIES;
        }

        // Trunks is student/son of Vegeta
        if ((isTrunks && isVegeta) || (isTrunksB && isVegetaB)) {
            return RelationshipType.MASTER_STUDENT;
        }

        // Gogeta / Vegito / Fusions are Allies to base members
        const isFusion = idA.includes('gogeta');
        const isFusionB = idB.includes('gogeta');
        if ((isFusion && (isGokuB || isVegeta)) || (isFusionB && (isGoku || isVegetaB))) {
            return RelationshipType.ALLIES;
        }

        return RelationshipType.NEUTRAL;
    }
}
