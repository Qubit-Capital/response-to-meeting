export interface ILearningActingMemory {
    _id: { $oid: string };
    actor: string;
    scenario: string;
    categories: Array<{
        id: string;
        name: string;
    }>;
    instruction: string;
    createdAt: Date;
    updatedAt: Date;
}